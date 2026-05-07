import Database from 'better-sqlite3';
import { resolve } from 'path';

const DB_PATH = resolve('/Users/sherzodsanakulov/.openclaw/workspace/project-dashboard', 'dashboard.db');

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDb() {
  const db = getDb();
  
  // Core tables
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'openclaw',
      status TEXT DEFAULT 'idle',
      skills TEXT,
      config TEXT,
      current_task_id INTEGER,
      -- CLI-specific fields
      cli_command TEXT,
      cli_args TEXT DEFAULT '[]',
      working_dir TEXT,
      cost_per_1k_tokens REAL DEFAULT 0,
      total_tokens_used INTEGER DEFAULT 0,
      total_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'backlog',
      priority TEXT DEFAULT 'medium',
      assigned_agent_id INTEGER,
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (assigned_agent_id) REFERENCES agents(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER,
      task_id INTEGER,
      project_id INTEGER,
      action TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // NEW: Agent runs - tracks actual CLI executions
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

  // NEW: Agent outputs - streaming logs
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

  // NEW: Task templates
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

  // Seed if empty
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    seedInitialData(db);
  }

  // Update agents with CLI commands if they don't have them
  updateAgentCommands(db);

  return db;
}

function seedInitialData(db: Database.Database) {
  // Seed projects from GitHub
  const seedProjects = db.prepare(`
    INSERT INTO projects (name, description, icon, color, task_count, agent_count) VALUES
    ('Deal-hunter', 'Dutch grocery deal scraper and price tracker', '🛒', 'green', 5, 2),
    ('LocalSiteAI', 'Local AI site builder', '🤖', 'purple', 3, 1),
    ('Melanium', 'Project management tool', '📊', 'blue', 2, 0)
  `);
  seedProjects.run();

  // Seed agents with CLI commands
  const seedAgents = db.prepare(`
    INSERT INTO agents (name, type, status, skills, cli_command, cli_args, working_dir, cost_per_1k_tokens) VALUES
    ('Yordamchi', 'openclaw', 'idle', 'typescript,scraping,api,fullstack', 'openclaw', '[]', '/Users/sherzodsanakulov/.openclaw/workspace', 0.00),
    ('Claude Code', 'codex', 'idle', 'typescript,python,architecture', 'claude', '["--print", "--permission-mode", "bypassPermissions"]', '/Users/sherzodsanakulov/.openclaw/workspace', 3.00),
    ('Gemini', 'openclaw', 'idle', 'javascript,react,ui', 'openclaw', '[]', '/Users/sherzodsanakulov/.openclaw/workspace', 0.00),
    ('Telegram Bot #1', 'telegram', 'idle', 'notifications,messaging', null, null, null, 0.00)
  `);
  seedAgents.run();

  // Seed tasks
  const seedTasks = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, priority, assigned_agent_id) VALUES
    (1, 'Fix Lidl scraper images', 'Extract real product images from Lidl website', 'in_progress', 'high', 2),
    (1, 'Add Albert Heijn API scraper', 'Use ah.nl API to fetch bonus deals', 'done', 'high', 1),
    (1, 'Push v1.0 to production', 'Deploy Deal-hunter to production server', 'done', 'urgent', 1),
    (2, 'Set up pgvector', 'Add vector search for user stories', 'backlog', 'medium', null),
    (2, 'Build story generator UI', 'Create interface for generating stories', 'in_progress', 'high', 3),
    (3, 'Redesign homepage', 'Modern, clean design with animations', 'backlog', 'low', null)
  `);
  seedTasks.run();

  // Seed activities
  const seedActivities = db.prepare(`
    INSERT INTO activities (agent_id, task_id, project_id, action, message) VALUES
    (1, 2, 1, 'completed', 'Successfully added AH API scraper with 41 deals'),
    (2, 1, 1, 'started', 'Working on image extraction for Lidl scraper'),
    (1, 3, 1, 'completed', 'Deployed v1.0 to production 🚀'),
    (4, null, 1, 'notification', 'Daily summary: 630 deals active across 6 stores')
  `);
  seedActivities.run();

  // Seed task templates
  const seedTemplates = db.prepare(`
    INSERT INTO task_templates (name, description, icon, priority, default_agent_type, prompt_template) VALUES
    ('Bug Fix', 'Fix a bug or error in the codebase', '🐛', 'high', 'codex', 'Fix the following bug: {{description}}. Investigate the root cause and implement a clean fix.'),
    ('Feature', 'Add a new feature or capability', '✨', 'medium', 'openclaw', 'Implement the following feature: {{description}}. Write clean, well-tested code.'),
    ('Refactor', 'Improve code quality without changing behavior', '♻️', 'low', 'codex', 'Refactor the following code: {{description}}. Improve readability, performance, and maintainability.'),
    ('Code Review', 'Review code for quality and issues', '👀', 'medium', 'codex', 'Review the following code: {{description}}. Check for bugs, security issues, and best practices.'),
    ('Documentation', 'Write or update documentation', '📝', 'low', 'openclaw', 'Write documentation for: {{description}}. Include examples and clear explanations.')
  `);
  seedTemplates.run();
}

function updateAgentCommands(db: Database.Database) {
  const agents = db.prepare('SELECT id, name, type FROM agents WHERE cli_command IS NULL').all() as any[];
  
  const commandMap: Record<string, { cmd: string; args: string[] }> = {
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
  }
}
