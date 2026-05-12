import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const runId = parseInt(id, 10);
  if (Number.isNaN(runId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const run = db
    .prepare(
      `SELECT r.*, a.name as agent_name, t.title as task_title
       FROM agent_runs r
       JOIN agents a ON r.agent_id = a.id
       LEFT JOIN tasks t ON r.task_id = t.id
       WHERE r.id = ?`
    )
    .get(runId);

  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  return NextResponse.json(run);
}
