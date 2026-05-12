import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface WorkflowRow {
  id: number;
  name: string;
  description: string;
  dag_json: string;
  created_at: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const workflowId = parseInt(id);

  const workflow = db.prepare('SELECT * FROM dag_workflows WHERE id = ?').get(workflowId) as WorkflowRow | undefined;
  
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...workflow,
    dag: JSON.parse(workflow.dag_json)
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const workflowId = parseInt(id);
  const body = await request.json();
  const { name, description, dag } = body;

  const workflow = db.prepare('SELECT * FROM dag_workflows WHERE id = ?').get(workflowId) as WorkflowRow | undefined;
  
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  db.prepare(`
    UPDATE dag_workflows 
    SET name = ?, description = ?, dag_json = ?
    WHERE id = ?
  `).run(
    name || workflow.name,
    description !== undefined ? description : workflow.description,
    dag ? JSON.stringify(dag) : workflow.dag_json,
    workflowId
  );

  const updated = db.prepare('SELECT * FROM dag_workflows WHERE id = ?').get(workflowId) as WorkflowRow;
  return NextResponse.json({
    ...updated,
    dag: JSON.parse(updated.dag_json)
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const workflowId = parseInt(id);

  const workflow = db.prepare('SELECT * FROM dag_workflows WHERE id = ?').get(workflowId) as WorkflowRow | undefined;
  
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM dag_workflows WHERE id = ?').run(workflowId);
  
  return NextResponse.json({ success: true });
}
