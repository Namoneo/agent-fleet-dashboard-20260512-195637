import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface ExecutionRow {
  id: number;
  workflow_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  canvas_data: string | null;
  workflow_name: string;
  workflow_description: string;
  dag_json: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const executionId = parseInt(id);

  const execution = db.prepare(`
    SELECT 
      de.*,
      dw.name as workflow_name,
      dw.description as workflow_description,
      dw.dag_json
    FROM dag_executions de
    JOIN dag_workflows dw ON de.workflow_id = dw.id
    WHERE de.id = ?
  `).get(executionId) as ExecutionRow | undefined;

  if (!execution) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...execution,
    dag: JSON.parse(execution.dag_json),
    canvas_data: execution.canvas_data ? JSON.parse(execution.canvas_data) : null
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const executionId = parseInt(id);
  const body = await request.json();
  const { status, canvas_data } = body;

  const execution = db.prepare('SELECT * FROM dag_executions WHERE id = ?').get(executionId);
  if (!execution) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (status) {
    updates.push('status = ?');
    values.push(status);
    if (status === 'completed' || status === 'error') {
      updates.push('completed_at = datetime("now")');
    }
  }

  if (canvas_data) {
    updates.push('canvas_data = ?');
    values.push(JSON.stringify(canvas_data));
  }

  if (updates.length > 0) {
    values.push(executionId);
    db.prepare(`
      UPDATE dag_executions 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);
  }

  const updated = db.prepare(`
    SELECT 
      de.*,
      dw.name as workflow_name,
      dw.description as workflow_description,
      dw.dag_json
    FROM dag_executions de
    JOIN dag_workflows dw ON de.workflow_id = dw.id
    WHERE de.id = ?
  `).get(executionId) as ExecutionRow;

  return NextResponse.json({
    ...updated,
    dag: JSON.parse(updated.dag_json),
    canvas_data: updated.canvas_data ? JSON.parse(updated.canvas_data) : null
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const executionId = parseInt(id);

  const execution = db.prepare('SELECT * FROM dag_executions WHERE id = ?').get(executionId);
  if (!execution) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM dag_executions WHERE id = ?').run(executionId);

  return NextResponse.json({ success: true });
}
