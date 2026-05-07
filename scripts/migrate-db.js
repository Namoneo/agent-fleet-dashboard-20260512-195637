import Database from 'better-sqlite3';
import { resolve } from 'path';

const DB_PATH = resolve('/Users/sherzodsanakulov/.openclaw/workspace/project-dashboard', 'dashboard.db');
const db = new Database(DB_PATH);

console.log('Running migrations...\n');

// Enable foreign keys
db.pragma('foreign_keys = OFF');

// Create new tables
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    task_id INTEGER,
    project_id INTEGER,
    command TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    pid INTEGER,
    exit_code INTEGER,
    stdout TEXT,
    stderr TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS agent_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    type TEXT DEFAULT 'stdout',
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📋',
    priority TEXT DEFAULT 'medium',
    default_agent_type TEXT,
    prompt_template TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add columns to agents table if they don't exist
try {
  db.exec(`ALTER TABLE agents ADD COLUMN cli_command TEXT`);
  console.log('Added cli_command column');
} catch (e) {
  console.log('cli_command column already exists');
}

try {
  db.exec(`ALTER TABLE agents ADD COLUMN cli_args TEXT DEFAULT '[]'`);
  console.log('Added cli_args column');
} catch (e) {
  console.log('cli_args column already exists');
}

try {
  db.exec(`ALTER TABLE agents ADD COLUMN working_dir TEXT`);
  console.log('Added working_dir column');
} catch (e) {
  console.log('working_dir column already exists');
}

try {
  db.exec(`ALTER TABLE agents ADD COLUMN cost_per_1k_tokens REAL DEFAULT 0`);
  console.log('Added cost_per_1k_tokens column');
} catch (e) {
  console.log('cost_per_1k_tokens column already exists');
}

try {
  db.exec(`ALTER TABLE agents ADD COLUMN total_tokens_used INTEGER DEFAULT 0`);
  console.log('Added total_tokens_used column');
} catch (e) {
  console.log('total_tokens_used column already exists');
}

try {
  db.exec(`ALTER TABLE agents ADD COLUMN total_cost REAL DEFAULT 0`);
  console.log('Added total_cost column');
} catch (e) {
  console.log('total_cost column already exists');
}

// Update agents with CLI commands
const agents = db.prepare("SELECT id, name FROM agents WHERE cli_command IS NULL").all();
const commandMap = {
  'Claude Code': { cmd: 'claude', args: ['--print', '--permission-mode', 'bypassPermissions'] },
  'Codex': { cmd: 'codex', args: [] },
  'Gemini': { cmd: 'gemini', args: [] },
  'Cursor': { cmd: 'cursor', args: [] },
  'OpenCode': { cmd: 'opencode', args: [] },
};

const update = db.prepare('UPDATE agents SET cli_command = ?, cli_args = ? WHERE id = ?');
for (const agent of agents) {
  const config = commandMap[agent.name] || { cmd: null, args: [] };
  update.run(config.cmd, JSON.stringify(config.args), agent.id);
  console.log(`Updated ${agent.name}: ${config.cmd}`);
}

// Seed task templates
const templateCount = db.prepare('SELECT COUNT(*) as c FROM task_templates').get();
if (templateCount.c === 0) {
  const seedTemplates = db.prepare(`
    INSERT INTO task_templates (name, description, icon, priority, default_agent_type, prompt_template) VALUES
    ('Bug Fix', 'Fix a bug or error in the codebase', '🐛', 'high', 'codex', 'Fix the following bug: {{description}}. Investigate the root cause and implement a clean fix.'),
    ('Feature', 'Add a new feature or capability', '✨', 'medium', 'openclaw', 'Implement the following feature: {{description}}. Write clean, well-tested code.'),
    ('Refactor', 'Improve code quality without changing behavior', '♻️', 'low', 'codex', 'Refactor the following code: {{description}}. Improve readability, performance, and maintainability.'),
    ('Code Review', 'Review code for quality and issues', '👀', 'medium', 'codex', 'Review the following code: {{description}}. Check for bugs, security issues, and best practices.'),
    ('Documentation', 'Write or update documentation', '📝', 'low', 'openclaw', 'Write documentation for: {{description}}. Include examples and clear explanations.')
  `);
  seedTemplates.run();
  console.log('Seeded 5 task templates');
}

db.pragma('foreign_keys = ON');

console.log('\n✅ Migrations complete!');
