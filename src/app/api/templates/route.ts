import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const templates = db.prepare('SELECT * FROM task_templates ORDER BY name').all();
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { name, description, icon, priority, default_agent_type, prompt_template } = body;

  const result = db.prepare(`
    INSERT INTO task_templates (name, description, icon, priority, default_agent_type, prompt_template)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, description, icon, priority, default_agent_type, prompt_template);

  const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(template, { status: 201 });
}
