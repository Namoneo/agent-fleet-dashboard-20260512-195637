import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// List recent runs across all agents, newest first. Supports ?status= and
// ?limit= filters.
export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limitParam = parseInt(searchParams.get('limit') ?? '100', 10);
  const limit = Number.isNaN(limitParam) ? 100 : Math.min(Math.max(limitParam, 1), 500);

  const where: string[] = [];
  const args: unknown[] = [];
  if (status) {
    where.push('r.status = ?');
    args.push(status);
  }

  const runs = db
    .prepare(
      `SELECT r.*, a.name as agent_name, t.title as task_title
       FROM agent_runs r
       JOIN agents a ON r.agent_id = a.id
       LEFT JOIN tasks t ON r.task_id = t.id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY r.started_at DESC
       LIMIT ?`
    )
    .all(...args, limit);

  return NextResponse.json(runs);
}
