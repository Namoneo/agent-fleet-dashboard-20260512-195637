import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface WorkflowRow {
  id: number;
  name: string;
  description: string;
  dag_json: string;
  created_at: string;
}

export async function GET() {
  const db = getDb();
  const workflows = db.prepare('SELECT * FROM dag_workflows ORDER BY name').all() as WorkflowRow[];
  
  // Parse dag_json for each workflow
  const parsedWorkflows = workflows.map((wf: WorkflowRow) => ({
    ...wf,
    dag: JSON.parse(wf.dag_json)
  }));
  
  return NextResponse.json(parsedWorkflows);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { name, description, dag } = body;

  const result = db.prepare(`
    INSERT INTO dag_workflows (name, description, dag_json)
    VALUES (?, ?, ?)
  `).run(name, description, JSON.stringify(dag));

  const workflow = db.prepare('SELECT * FROM dag_workflows WHERE id = ?').get(result.lastInsertRowid) as WorkflowRow;
  return NextResponse.json({ ...workflow, dag: JSON.parse(workflow.dag_json) }, { status: 201 });
}
