import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const tasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.icon as project_icon, a.name as agent_name, a.type as agent_type
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    LEFT JOIN agents a ON t.assigned_agent_id = a.id
    ORDER BY t.created_at DESC
  `).all();
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  
  const { project_id, title, description, priority = 'medium', assigned_agent_id } = body;
  
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO tasks (project_id, title, description, priority, assigned_agent_id, status)
    VALUES (?, ?, ?, ?, ?, 'backlog')
  `).run(project_id, title, description, priority, assigned_agent_id);

  // Update project task count
  if (project_id) {
    db.prepare(`
      UPDATE projects SET task_count = task_count + 1 WHERE id = ?
    `).run(project_id);
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { id, status, assigned_agent_id } = body;

  if (!id) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (status) {
    updates.push('status = ?');
    values.push(status);
    if (status === 'done') {
      updates.push('completed_at = CURRENT_TIMESTAMP');
    }
  }
  if (assigned_agent_id !== undefined) {
    updates.push('assigned_agent_id = ?');
    values.push(assigned_agent_id);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  values.push(id);
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return NextResponse.json(task);
}
