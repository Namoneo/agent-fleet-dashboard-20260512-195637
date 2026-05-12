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
console.log('Using DB:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📁',
    color TEXT DEFAULT 'blue',
    status TEXT DEFAULT 'active',
    task_count INTEGER DEFAULT 0,
    agent_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Delete tasks first (FK constraint), then projects
db.prepare('DELETE FROM tasks').run();
db.prepare('DELETE FROM projects').run();

// Add all GitHub repos as projects
const repos = [
  { name: 'Deal-hunter', description: 'Dutch grocery deal scraper and price tracker', icon: '🛒', color: 'green', task_count: 5, agent_count: 2 },
  { name: 'LocalSiteAI', description: 'Local AI site builder', icon: '🤖', color: 'purple', task_count: 0, agent_count: 0 },
  { name: 'Melanium', description: 'Project management tool', icon: '📊', color: 'blue', task_count: 0, agent_count: 0 },
  { name: 'cbr-theory-ai', description: 'CBR Theory AI implementation', icon: '🧠', color: 'indigo', task_count: 0, agent_count: 0 },
  { name: 'reader-app', description: 'Reading application', icon: '📖', color: 'orange', task_count: 0, agent_count: 0 },
  { name: 'developer-portfolio', description: 'Dark modern developer portfolio', icon: '💼', color: 'gray', task_count: 0, agent_count: 0 },
  { name: 'landing-page', description: 'Landing page templates', icon: '🚀', color: 'teal', task_count: 0, agent_count: 0 },
  { name: 'klussen-app', description: 'Handyman services app', icon: '🔧', color: 'yellow', task_count: 0, agent_count: 0 },
  { name: 'cbr-theory-frontend', description: 'CBR Theory frontend', icon: '⚛️', color: 'cyan', task_count: 0, agent_count: 0 },
  { name: 'CMS', description: 'Content management system', icon: '📝', color: 'pink', task_count: 0, agent_count: 0 },
  { name: 'ecommerce-api', description: 'E-commerce API', icon: '🛍️', color: 'emerald', task_count: 0, agent_count: 0 },
  { name: 'nightmanagerscms', description: 'Night managers CMS', icon: '🌙', color: 'violet', task_count: 0, agent_count: 0 },
  { name: 'webshop-in-angular', description: 'Webshop in Angular', icon: '🅰️', color: 'red', task_count: 0, agent_count: 0 },
  { name: 'clawpilot', description: 'ClawPilot project', icon: '🎯', color: 'lime', task_count: 0, agent_count: 0 },
  { name: 'tailwindvault', description: 'Premium Tailwind components', icon: '🎨', color: 'sky', task_count: 0, agent_count: 0 },
  { name: 'openclaw-multi-repo-template', description: 'Multi-repo automation template', icon: '🔄', color: 'zinc', task_count: 0, agent_count: 0 },
  { name: 'mijdrecht', description: 'Mijdrecht project', icon: '🏘️', color: 'amber', task_count: 0, agent_count: 0 },
  { name: 'personal-linear', description: 'Personal Linear app', icon: '📈', color: 'rose', task_count: 0, agent_count: 0 },
  { name: 'mac-setup', description: 'Mac setup scripts', icon: '💻', color: 'slate', task_count: 0, agent_count: 0 },
  { name: 'AI-assistant-', description: 'AI assistant project', icon: '🤖', color: 'fuchsia', task_count: 0, agent_count: 0 },
  { name: 'taxi-landing-page', description: 'Taxi landing page', icon: '🚕', color: 'yellow', task_count: 0, agent_count: 0 },
  { name: 'document-management-system-app', description: 'Document management system', icon: '📁', color: 'blue', task_count: 0, agent_count: 0 },
  { name: 'veriflow', description: 'Verification flow tool', icon: '✅', color: 'green', task_count: 0, agent_count: 0 },
  { name: 'issue-tracker', description: 'Issue tracking system', icon: '🐛', color: 'orange', task_count: 0, agent_count: 0 },
  { name: 'Generative-UI-platform', description: 'Generative UI platform', icon: '🎭', color: 'purple', task_count: 0, agent_count: 0 },
  { name: 'Schedule-SAAS-app', description: 'Schedule SaaS app', icon: '📅', color: 'teal', task_count: 0, agent_count: 0 },
  { name: 'VirtualTry', description: 'Virtual trial room', icon: '👗', color: 'pink', task_count: 0, agent_count: 0 },
  { name: 'bestmetall', description: 'Bestmetall website', icon: '⚙️', color: 'gray', task_count: 0, agent_count: 0 },
  { name: 'x-ray-ai-expert', description: 'X-ray AI expert system', icon: '🩻', color: 'indigo', task_count: 0, agent_count: 0 },
  { name: 'dms-backend', description: 'DMS backend', icon: '🔌', color: 'slate', task_count: 0, agent_count: 0 },
];

const insert = db.prepare('INSERT INTO projects (name, description, icon, color, task_count, agent_count) VALUES (?, ?, ?, ?, ?, ?)');

for (const repo of repos) {
  insert.run(repo.name, repo.description, repo.icon, repo.color, repo.task_count, repo.agent_count);
}

console.log(`✅ Added ${repos.length} projects from GitHub`);
console.log('📁 Database:', DB_PATH);
