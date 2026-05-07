import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { spawn } from 'child_process';
import { resolve } from 'path';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const agentId = parseInt(params.id);
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
  const workingDir = cwd || agent.working_dir || process.cwd();

  // Create run record
  const runResult = db.prepare(`
    INSERT INTO agent_runs (agent_id, task_id, command, status, started_at)
    VALUES (?, ?, ?, 'running', datetime('now'))
  `).run(agentId, task_id || null, `${cliCommand} ${cliArgs.join(' ')}`);

  const runId = runResult.lastInsertRowid;

  // Update agent status
  db.prepare('UPDATE agents SET status = ?, current_task_id = ? WHERE id = ?')
    .run('busy', task_id || null, agentId);

  // Spawn process
  const child = spawn(cliCommand, cliArgs, {
    cwd: resolve(workingDir),
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
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const agentId = parseInt(params.id);
  
  const runs = db.prepare(`
    SELECT r.*, a.name as agent_name, t.title as task_title
    FROM agent_runs r
    JOIN agents a ON r.agent_id = a.id
    LEFT JOIN tasks t ON r.task_id = t.id
    WHERE r.agent_id = ?
    ORDER BY r.started_at DESC
    LIMIT 20
  `).all(agentId);

  return NextResponse.json(runs);
}
