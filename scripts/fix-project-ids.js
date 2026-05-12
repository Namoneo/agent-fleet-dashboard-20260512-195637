import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';

const DB_PATH = (() => {
  const fromEnv = process.env.DASHBOARD_DB_PATH;
  const p =
    typeof fromEnv === 'string' && fromEnv.trim() !== ''
      ? resolve(fromEnv.trim())
      : join(process.cwd(), '.data', 'dashboard.db');
  mkdirSync(dirname(p), { recursive: true });
  return p;
})();
const db = new Database(DB_PATH);

db.pragma('foreign_keys = OFF');

// Get project ID mapping
const projects = db.prepare("SELECT id, name FROM projects WHERE name IN ('Deal-hunter', 'User Story Generator', 'Personal Website')").all();
console.log('Projects:');
for (const p of projects) {
  console.log(' ', p.id, p.name);
}

// Update task project_ids (old IDs 1,2,3 → new IDs from the projects)
const dealHunterId = projects.find(p => p.name === 'Deal-hunter')?.id;
const userStoryId = projects.find(p => p.name === 'User Story Generator')?.id;
const personalWebsiteId = projects.find(p => p.name === 'Personal Website')?.id;

console.log('\nMapping:');
console.log('  1 →', dealHunterId);
console.log('  2 →', userStoryId);
console.log('  3 →', personalWebsiteId);

if (dealHunterId) db.prepare('UPDATE tasks SET project_id = ? WHERE project_id = 1').run(dealHunterId);
if (userStoryId) db.prepare('UPDATE tasks SET project_id = ? WHERE project_id = 2').run(userStoryId);
if (personalWebsiteId) db.prepare('UPDATE tasks SET project_id = ? WHERE project_id = 3').run(personalWebsiteId);

// Update activity project_ids
if (dealHunterId) db.prepare('UPDATE activities SET project_id = ? WHERE project_id = 1').run(dealHunterId);

// Recalculate task counts
const counts = db.prepare('SELECT project_id, COUNT(*) as c FROM tasks GROUP BY project_id').all();
for (const c of counts) {
  db.prepare('UPDATE projects SET task_count = ? WHERE id = ?').run(c.c, c.project_id);
}

// Set all other projects to 0 tasks
db.prepare('UPDATE projects SET task_count = 0 WHERE id NOT IN (SELECT project_id FROM tasks)').run();

db.pragma('foreign_keys = ON');

// Verify
const finalProjects = db.prepare('SELECT id, name, task_count FROM projects WHERE task_count > 0').all();
console.log('\n=== RESULTS ===');
console.log('Projects with tasks:');
for (const p of finalProjects) {
  console.log(' ', p.id, p.name, ':', p.task_count);
}

const finalTasks = db.prepare('SELECT t.id, t.title, p.name as project_name, t.status FROM tasks t JOIN projects p ON t.project_id = p.id').all();
console.log('\nTasks:');
for (const t of finalTasks) {
  console.log(' ', t.id, t.title, '|', t.project_name, '|', t.status);
}

console.log('\n✅ Project IDs fixed!');
