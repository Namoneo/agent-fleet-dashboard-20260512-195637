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

// Terminate a running execution: kill its OS process (if still alive) and
// mark the run as terminated, freeing the owning agent.
export async function DELETE(
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
    .prepare('SELECT id, agent_id, pid, status FROM agent_runs WHERE id = ?')
    .get(runId) as { id: number; agent_id: number; pid: number | null; status: string } | undefined;

  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  if (run.status !== 'running' && run.status !== 'pending') {
    return NextResponse.json({ error: `Run already ${run.status}` }, { status: 409 });
  }

  // Best-effort process kill; the process may already be gone.
  if (run.pid) {
    try {
      process.kill(run.pid, 'SIGTERM');
    } catch {
      /* process already exited or not owned by this host */
    }
  }

  db.prepare(
    `UPDATE agent_runs SET status = 'terminated', completed_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(runId);

  db.prepare('UPDATE agents SET status = ?, current_task_id = NULL WHERE id = ?')
    .run('idle', run.agent_id);

  const updated = db.prepare('SELECT * FROM agent_runs WHERE id = ?').get(runId);
  return NextResponse.json(updated);
}
