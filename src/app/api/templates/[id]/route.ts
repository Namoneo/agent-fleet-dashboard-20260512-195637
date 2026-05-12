import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const templateId = parseInt(id, 10);
  if (Number.isNaN(templateId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(templateId);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  return NextResponse.json(template);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const templateId = parseInt(id, 10);
  if (Number.isNaN(templateId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const existing = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(templateId) as Record<string, unknown> | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const body = await request.json();
  const name = body.name !== undefined ? String(body.name).trim() : (existing.name as string);
  if (!name) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
  }

  const description = body.description !== undefined ? body.description : existing.description;
  const icon = body.icon !== undefined ? body.icon : existing.icon;
  const priority = body.priority !== undefined ? body.priority : existing.priority;
  const default_agent_type = body.default_agent_type !== undefined ? body.default_agent_type : existing.default_agent_type;
  const prompt_template = body.prompt_template !== undefined ? body.prompt_template : existing.prompt_template;

  db.prepare(
    `UPDATE task_templates SET name = ?, description = ?, icon = ?, priority = ?, default_agent_type = ?, prompt_template = ? WHERE id = ?`
  ).run(name, description, icon, priority, default_agent_type, prompt_template, templateId);

  const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(templateId);
  return NextResponse.json(template);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const templateId = parseInt(id, 10);
  if (Number.isNaN(templateId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const result = db.prepare('DELETE FROM task_templates WHERE id = ?').run(templateId);
  if (result.changes === 0) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
