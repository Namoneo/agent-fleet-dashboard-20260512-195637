import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const projectId = parseInt(id, 10);
  if (Number.isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const tasks = db
    .prepare(
      `SELECT t.*, a.name as agent_name
       FROM tasks t
       LEFT JOIN agents a ON t.assigned_agent_id = a.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`
    )
    .all(projectId);

  return NextResponse.json({ project, tasks });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const projectId = parseInt(id, 10);
  if (Number.isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as Record<string, unknown> | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await request.json();
  const name = body.name !== undefined ? String(body.name).trim() : (existing.name as string);
  if (!name) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
  }

  const description = body.description !== undefined ? body.description : existing.description;
  const icon = body.icon !== undefined ? body.icon : existing.icon;
  const color = body.color !== undefined ? body.color : existing.color;
  const status = body.status !== undefined ? body.status : existing.status;
  const task_count = body.task_count !== undefined ? body.task_count : existing.task_count;
  const agent_count = body.agent_count !== undefined ? body.agent_count : existing.agent_count;

  db.prepare(
    `UPDATE projects SET name = ?, description = ?, icon = ?, color = ?, status = ?, task_count = ?, agent_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(name, description, icon, color, status, task_count, agent_count, projectId);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  return NextResponse.json(project);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const projectId = parseInt(id, 10);
  if (Number.isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const existing = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  db.prepare('UPDATE tasks SET project_id = NULL WHERE project_id = ?').run(projectId);
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  return NextResponse.json({ success: true });
}
