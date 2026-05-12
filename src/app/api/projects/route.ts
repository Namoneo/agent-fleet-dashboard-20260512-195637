import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { name, description, icon = '📁', color = 'blue', status = 'active' } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const result = db
    .prepare(
      `INSERT INTO projects (name, description, icon, color, status, task_count, agent_count)
       VALUES (?, ?, ?, ?, ?, 0, 0)`
    )
    .run(name.trim(), description ?? null, icon, color, status);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(project, { status: 201 });
}
