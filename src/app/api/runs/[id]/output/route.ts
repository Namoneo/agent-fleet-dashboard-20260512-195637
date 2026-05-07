import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const runId = parseInt(id);

  const outputs = db.prepare(`
    SELECT id, type, content, created_at
    FROM agent_outputs
    WHERE run_id = ?
    ORDER BY created_at ASC
  `).all(runId);

  return NextResponse.json(outputs);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const runId = parseInt(id);
  const body = await request.json();
  const { type = 'stdout', content } = body;

  const result = db.prepare(`
    INSERT INTO agent_outputs (run_id, type, content) VALUES (?, ?, ?)
  `).run(runId, type, content);

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
