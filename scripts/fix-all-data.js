import Database from 'better-sqlite3';
import { resolve } from 'path';

const DB_PATH = resolve('/Users/sherzodsanakulov/.openclaw/workspace/project-dashboard', 'dashboard.db');
const db = new Database(DB_PATH);

db.pragma('foreign_keys = OFF');

// Add missing projects if they don't exist
const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (id, name, description, icon, color, status, task_count, agent_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertProject.run(1, 'Deal-hunter', 'Dutch grocery deal scraper and price tracker', '🛒', 'green', 'active', 3, 2);
insertProject.run(2, 'User Story Generator', 'AI-powered user story creation tool', '📝', 'purple', 'active', 0, 1);
insertProject.run(3, 'Personal Website', 'Portfolio and blog site redesign', '🌐', 'blue', 'active', 0, 0);

// Update task project_ids
// Tasks 7,8,9 should be on Deal-hunter (id 1 or 4)
// Tasks 10,11 should be on User Story Generator (id 2)
// Task 12 should be on Personal Website (id 3)

db.prepare('UPDATE tasks SET project_id = 2 WHERE id = 10').run(); // Set up pgvector → User Story
db.prepare('UPDATE tasks SET project_id = 2 WHERE id = 11').run(); // Build story generator UI → User Story
db.prepare('UPDATE tasks SET project_id = 3 WHERE id = 12').run(); // Redesign homepage → Personal Website

// Recalculate task counts
db.prepare('UPDATE projects SET task_count = 0').run();
const counts = db.prepare('SELECT project_id, COUNT(*) as c FROM tasks GROUP BY project_id').all();
for (const c of counts) {
  db.prepare('UPDATE projects SET task_count = ? WHERE id = ?').run(c.c, c.project_id);
}

// Update activities
db.prepare('UPDATE activities SET project_id = 1 WHERE project_id = 4').run();

db.pragma('foreign_keys = ON');

// Verify
const finalProjects = db.prepare('SELECT id, name, task_count FROM projects WHERE task_count > 0 ORDER BY id').all();
console.log('Projects with tasks:');
for (const p of finalProjects) {
  console.log(' ', p.id, p.name, ':', p.task_count);
}

const finalTasks = db.prepare('SELECT t.id, t.title, p.name as project_name, t.status FROM tasks t JOIN projects p ON t.project_id = p.id').all();
console.log('\nTasks:');
for (const t of finalTasks) {
  console.log(' ', t.id, t.title, '|', t.project_name, '|', t.status);
}

console.log('\n✅ All data fixed!');
