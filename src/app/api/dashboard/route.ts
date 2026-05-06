import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

export async function GET() {
  const db = initDb();
  
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  const agents = db.prepare('SELECT * FROM agents ORDER BY status, name').all();
  const tasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.icon as project_icon, a.name as agent_name 
    FROM tasks t 
    LEFT JOIN projects p ON t.project_id = p.id 
    LEFT JOIN agents a ON t.assigned_agent_id = a.id
    ORDER BY 
      CASE priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        ELSE 4 
      END,
      t.created_at DESC
  `).all();
  const activities = db.prepare(`
    SELECT a.*, ag.name as agent_name, t.title as task_title, p.name as project_name
    FROM activities a
    LEFT JOIN agents ag ON a.agent_id = ag.id
    LEFT JOIN tasks t ON a.task_id = t.id
    LEFT JOIN projects p ON a.project_id = p.id
    ORDER BY a.created_at DESC
    LIMIT 20
  `).all();

  return NextResponse.json({ projects, agents, tasks, activities });
}
