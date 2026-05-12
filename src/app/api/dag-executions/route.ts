import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface WorkflowRow {
  id: number;
  name: string;
  description: string;
  dag_json: string;
  created_at: string;
}

interface ExecutionRow {
  id: number;
  workflow_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  canvas_data: string;
  workflow_name: string;
  workflow_description: string;
}

export async function GET() {
  const db = getDb();
  const executions = db.prepare(`
    SELECT 
      de.*,
      dw.name as workflow_name,
      dw.description as workflow_description
    FROM dag_executions de
    JOIN dag_workflows dw ON de.workflow_id = dw.id
    ORDER BY de.started_at DESC
  `).all() as ExecutionRow[];

  const parsedExecutions = executions.map((exec: ExecutionRow) => ({
    ...exec,
    canvas_data: exec.canvas_data ? JSON.parse(exec.canvas_data) : null
  }));

  return NextResponse.json(parsedExecutions);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { workflow_id, canvas_data } = body;

  const workflow = db.prepare('SELECT * FROM dag_workflows WHERE id = ?').get(workflow_id) as WorkflowRow | undefined;
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  const dag = JSON.parse(workflow.dag_json);
  const initialCanvasData = canvas_data || {
    workflow_title: dag.title,
    tasks: dag.tasks.map((t: any) => ({
      id: t.id,
      status: 'PENDING',
      output: '',
      started_at: null,
      completed_at: null
    })),
    overall_status: 'pending'
  };

  const result = db.prepare(`
    INSERT INTO dag_executions (workflow_id, status, canvas_data)
    VALUES (?, 'pending', ?)
  `).run(workflow_id, JSON.stringify(initialCanvasData));

  const execution = db.prepare(`
    SELECT 
      de.*,
      dw.name as workflow_name,
      dw.description as workflow_description
    FROM dag_executions de
    JOIN dag_workflows dw ON de.workflow_id = dw.id
    WHERE de.id = ?
  `).get(result.lastInsertRowid) as ExecutionRow;

  return NextResponse.json({
    ...execution,
    canvas_data: JSON.parse(execution.canvas_data)
  }, { status: 201 });
}
