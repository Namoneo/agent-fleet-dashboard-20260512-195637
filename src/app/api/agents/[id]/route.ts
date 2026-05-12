import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { resolveAgentSpawnCwd } from '@/lib/agent-cwd';
import { spawn } from 'child_process';
import { resolve } from 'path';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const agentId = parseInt(id);
  const body = await request.json();
  const { task_id, command, cwd, env = {} } = body;

  // Get agent config
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as any;
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Build command
  const cliCommand = command || agent.cli_command;
  if (!cliCommand) {
    return NextResponse.json({ error: 'Agent has no CLI command configured' }, { status: 400 });
  }

  const cliArgs = agent.cli_args ? JSON.parse(agent.cli_args) : [];

  const cwdResult = resolveAgentSpawnCwd(agent, cwd);
  if (!cwdResult.ok) {
    return NextResponse.json({ error: cwdResult.error }, { status: 400 });
  }
  const spawnCwd = cwdResult.cwd;

  // Create run record
  const runResult = db.prepare(`
    INSERT INTO agent_runs (agent_id, task_id, command, status, started_at, run_cwd)
    VALUES (?, ?, ?, 'running', datetime('now'), ?)
  `).run(agentId, task_id || null, `${cliCommand} ${cliArgs.join(' ')}`, spawnCwd);

  const runId = runResult.lastInsertRowid;

  // Update agent status
  db.prepare('UPDATE agents SET status = ?, current_task_id = ? WHERE id = ?')
    .run('busy', task_id || null, agentId);

  // Spawn process
  const child = spawn(cliCommand, cliArgs, {
    cwd: resolve(spawnCwd),
    env: { ...process.env, ...env },
    detached: false,
  });

  // Update run with PID
  db.prepare('UPDATE agent_runs SET pid = ? WHERE id = ?').run(child.pid, runId);

  // Capture output
  let stdout = '';
  let stderr = '';

  const insertOutput = db.prepare(`
    INSERT INTO agent_outputs (run_id, type, content) VALUES (?, ?, ?)
  `);

  child.stdout.on('data', (data) => {
    const chunk = data.toString();
    stdout += chunk;
    insertOutput.run(runId, 'stdout', chunk);
  });

  child.stderr.on('data', (data) => {
    const chunk = data.toString();
    stderr += chunk;
    insertOutput.run(runId, 'stderr', chunk);
  });

  child.on('close', (code) => {
    db.prepare(`
      UPDATE agent_runs 
      SET status = ?, exit_code = ?, stdout = ?, stderr = ?, completed_at = datetime('now')
      WHERE id = ?
    `).run(code === 0 ? 'completed' : 'failed', code, stdout, stderr, runId);

    db.prepare('UPDATE agents SET status = ?, current_task_id = NULL WHERE id = ?')
      .run('idle', agentId);

    // Update task status if provided
    if (task_id) {
      db.prepare('UPDATE tasks SET status = ? WHERE id = ?')
        .run(code === 0 ? 'done' : 'failed', task_id);
    }
  });

  return NextResponse.json({
    run_id: runId,
    pid: child.pid,
    status: 'running',
    command: `${cliCommand} ${cliArgs.join(' ')}`,
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const agentId = parseInt(id, 10);
  if (Number.isNaN(agentId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const runs = db
    .prepare(
      `
    SELECT r.*, a.name as agent_name, t.title as task_title
    FROM agent_runs r
    JOIN agents a ON r.agent_id = a.id
    LEFT JOIN tasks t ON r.task_id = t.id
    WHERE r.agent_id = ?
    ORDER BY r.started_at DESC
    LIMIT 50
  `
    )
    .all(agentId);

  return NextResponse.json({ agent, runs });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const agentId = parseInt(id, 10);
  if (Number.isNaN(agentId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const existing = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as Record<string, unknown> | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const body = await request.json();
  const name = body.name !== undefined ? String(body.name).trim() : (existing.name as string);
  if (!name) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
  }

  const type = body.type !== undefined ? body.type : existing.type;
  const status = body.status !== undefined ? body.status : existing.status;
  const skills = body.skills !== undefined ? body.skills : existing.skills;
  const config = body.config !== undefined ? body.config : existing.config;
  const cli_command = body.cli_command !== undefined ? body.cli_command : existing.cli_command;
  let cli_args = existing.cli_args as string | null;
  if (body.cli_args !== undefined) {
    cli_args =
      typeof body.cli_args === 'string' ? body.cli_args : JSON.stringify(body.cli_args ?? []);
  }
  const working_dir = body.working_dir !== undefined ? body.working_dir : existing.working_dir;
  let worktree_paths = existing.worktree_paths as string | null;
  if (body.worktree_paths !== undefined) {
    if (body.worktree_paths === null || body.worktree_paths === '') {
      worktree_paths = null;
    } else if (Array.isArray(body.worktree_paths)) {
      const arr = body.worktree_paths.filter((x: unknown) => typeof x === 'string' && String(x).trim());
      worktree_paths = JSON.stringify(arr);
    } else if (typeof body.worktree_paths === 'string') {
      try {
        const parsed = JSON.parse(body.worktree_paths);
        if (!Array.isArray(parsed)) {
          return NextResponse.json({ error: 'worktree_paths must be a JSON array of strings' }, { status: 400 });
        }
        const arr = parsed.filter((x: unknown) => typeof x === 'string' && String(x).trim());
        worktree_paths = JSON.stringify(arr);
      } catch {
        return NextResponse.json({ error: 'worktree_paths must be valid JSON array' }, { status: 400 });
      }
    }
  }
  const cost_per_1k_tokens =
    body.cost_per_1k_tokens !== undefined ? body.cost_per_1k_tokens : existing.cost_per_1k_tokens;

  db.prepare(
    `UPDATE agents SET name = ?, type = ?, status = ?, skills = ?, config = ?, cli_command = ?, cli_args = ?, working_dir = ?, worktree_paths = ?, cost_per_1k_tokens = ? WHERE id = ?`
  ).run(name, type, status, skills, config, cli_command, cli_args, working_dir, worktree_paths, cost_per_1k_tokens, agentId);

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
  return NextResponse.json(agent);
}
