import Database from 'better-sqlite3';
import { resolve } from 'path';

const DB_PATH = resolve('/Users/sherzodsanakulov/.openclaw/workspace/project-dashboard', 'dashboard.db');
const db = new Database(DB_PATH);

console.log('=== FIXING DATA ===\n');

// Disable foreign keys temporarily
db.pragma('foreign_keys = OFF');

// 1. Clear existing data
db.prepare('DELETE FROM activities').run();
db.prepare('DELETE FROM tasks').run();

// 2. Add tasks back
const tasks = [
  { project_id: 1, title: 'Fix Lidl scraper images', description: 'Extract real product images from Lidl website', status: 'in_progress', priority: 'high', assigned_agent_id: 2 },
  { project_id: 1, title: 'Add Albert Heijn API scraper', description: 'Use ah.nl API to fetch bonus deals', status: 'done', priority: 'high', assigned_agent_id: 1 },
  { project_id: 1, title: 'Push v1.0 to production', description: 'Deploy Deal-hunter to production server', status: 'done', priority: 'urgent', assigned_agent_id: 1 },
  { project_id: 2, title: 'Set up pgvector', description: 'Add vector search for user stories', status: 'backlog', priority: 'medium', assigned_agent_id: null },
  { project_id: 2, title: 'Build story generator UI', description: 'Create interface for generating stories', status: 'in_progress', priority: 'high', assigned_agent_id: 3 },
  { project_id: 3, title: 'Redesign homepage', description: 'Modern, clean design with animations', status: 'backlog', priority: 'low', assigned_agent_id: null },
];

const insertTask = db.prepare(`
  INSERT INTO tasks (project_id, title, description, status, priority, assigned_agent_id)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const task of tasks) {
  insertTask.run(task.project_id, task.title, task.description, task.status, task.priority, task.assigned_agent_id);
}

// 3. Update project task counts
const updateCounts = db.prepare(`
  UPDATE projects SET task_count = (
    SELECT COUNT(*) FROM tasks WHERE tasks.project_id = projects.id
  )
`);
updateCounts.run();

// 4. Add activities back
const activities = [
  { agent_id: 1, task_id: 2, project_id: 1, action: 'completed', message: 'Successfully added AH API scraper with 41 deals' },
  { agent_id: 2, task_id: 1, project_id: 1, action: 'started', message: 'Working on image extraction for Lidl scraper' },
  { agent_id: 1, task_id: 3, project_id: 1, action: 'completed', message: 'Deployed v1.0 to production 🚀' },
  { agent_id: 4, task_id: null, project_id: 1, action: 'notification', message: 'Daily summary: 630 deals active across 6 stores' },
];

const insertActivity = db.prepare(`
  INSERT INTO activities (agent_id, task_id, project_id, action, message)
  VALUES (?, ?, ?, ?, ?)
`);

for (const activity of activities) {
  insertActivity.run(activity.agent_id, activity.task_id, activity.project_id, activity.action, activity.message);
}

// Re-enable foreign keys
db.pragma('foreign_keys = ON');

// 5. Verify
const finalTasks = db.prepare('SELECT COUNT(*) as c FROM tasks').get();
const finalActivities = db.prepare('SELECT COUNT(*) as c FROM activities').get();
const projectCounts = db.prepare('SELECT name, task_count FROM projects WHERE task_count > 0').all();

console.log('\n=== RESULTS ===');
console.log('Tasks:', finalTasks.c);
console.log('Activities:', finalActivities.c);
console.log('\nProjects with tasks:');
for (const p of projectCounts) {
  console.log(`  ${p.name}: ${p.task_count} tasks`);
}

console.log('\n✅ Data fixed!');
