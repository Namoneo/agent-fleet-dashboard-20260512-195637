import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function adjustProjectTaskCount(db: ReturnType<typeof getDb>, projectId: number | null, delta: number) {
  if (projectId == null || delta === 0) return;
  db.prepare('UPDATE projects SET task_count = MAX(0, task_count + ?) WHERE id = ?').run(delta, projectId);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const taskId = parseInt(id, 10);
  if (Number.isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const task = db
    .prepare(
      `SELECT t.*, p.name as project_name, p.icon as project_icon, a.name as agent_name, a.type as agent_type
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN agents a ON t.assigned_agent_id = a.id
       WHERE t.id = ?`
    )
    .get(taskId);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const taskId = parseInt(id, 10);
  if (Number.isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Record<string, unknown> | undefined;
  if (!row) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const body = await request.json();
  const oldProjectId = row.project_id as number | null;

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    values.push(String(body.title).trim());
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    values.push(body.description);
  }
  if (body.status !== undefined) {
    updates.push('status = ?');
    values.push(body.status);
    if (body.status === 'done') {
      updates.push("completed_at = COALESCE(completed_at, datetime('now'))");
    } else {
      updates.push('completed_at = NULL');
    }
  }
  if (body.priority !== undefined) {
    updates.push('priority = ?');
    values.push(body.priority);
  }
  if (body.project_id !== undefined) {
    updates.push('project_id = ?');
    values.push(body.project_id === null || body.project_id === '' ? null : parseInt(String(body.project_id), 10));
  }
  if (body.assigned_agent_id !== undefined) {
    updates.push('assigned_agent_id = ?');
    values.push(
      body.assigned_agent_id === null || body.assigned_agent_id === '' ? null : parseInt(String(body.assigned_agent_id), 10)
    );
  }
  if (body.due_date !== undefined) {
    updates.push('due_date = ?');
    values.push(body.due_date === null || body.due_date === '' ? null : body.due_date);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const newProjectId =
    body.project_id !== undefined
      ? body.project_id === null || body.project_id === ''
        ? null
        : parseInt(String(body.project_id), 10)
      : oldProjectId;

  if (body.project_id !== undefined && newProjectId !== oldProjectId) {
    adjustProjectTaskCount(db, oldProjectId, -1);
    adjustProjectTaskCount(db, newProjectId, 1);
  }

  values.push(taskId);
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const task = db
    .prepare(
      `SELECT t.*, p.name as project_name, p.icon as project_icon, a.name as agent_name, a.type as agent_type
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN agents a ON t.assigned_agent_id = a.id
       WHERE t.id = ?`
    )
    .get(taskId);

  return NextResponse.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const taskId = parseInt(id, 10);
  if (Number.isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const row = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(taskId) as { project_id: number | null } | undefined;
  if (!row) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  adjustProjectTaskCount(db, row.project_id, -1);

  return NextResponse.json({ success: true });
}
