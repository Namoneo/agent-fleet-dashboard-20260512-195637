import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);
  const agentId = searchParams.get('agent_id');
  const taskId = searchParams.get('task_id');
  const projectId = searchParams.get('project_id');

  const where: string[] = [];
  const args: unknown[] = [];

  if (agentId) {
    where.push('a.agent_id = ?');
    args.push(parseInt(agentId, 10));
  }
  if (taskId) {
    where.push('a.task_id = ?');
    args.push(parseInt(taskId, 10));
  }
  if (projectId) {
    where.push('a.project_id = ?');
    args.push(parseInt(projectId, 10));
  }

  const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const activities = db
    .prepare(
      `SELECT a.*, ag.name as agent_name, t.title as task_title, p.name as project_name
       FROM activities a
       LEFT JOIN agents ag ON a.agent_id = ag.id
       LEFT JOIN tasks t ON a.task_id = t.id
       LEFT JOIN projects p ON a.project_id = p.id
       ${sqlWhere}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...args, limit, offset);

  return NextResponse.json({ activities, limit, offset });
}
