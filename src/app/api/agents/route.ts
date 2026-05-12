import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const agents = db.prepare(`
    SELECT a.*, 
      t.title as current_task_title,
      p.name as current_project_name,
      r.id as current_run_id,
      r.status as run_status,
      r.exit_code as run_exit_code
    FROM agents a
    LEFT JOIN tasks t ON a.current_task_id = t.id
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN agent_runs r ON a.id = r.agent_id AND r.status = 'running'
    ORDER BY a.status, a.name
  `).all();
  return NextResponse.json(agents);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { name, type, skills, cli_command, cli_args, working_dir } = body;

  const result = db.prepare(`
    INSERT INTO agents (name, type, status, skills, cli_command, cli_args, working_dir)
    VALUES (?, ?, 'idle', ?, ?, ?, ?)
  `).run(name, type, skills, cli_command, JSON.stringify(cli_args || []), working_dir);

  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(agent, { status: 201 });
}
