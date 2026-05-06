import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    db = new Database('./dashboard.db');
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDb() {
  const db = getDb();
  
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

  // Seed if empty
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    const seedProjects = db.prepare(`
      INSERT INTO projects (name, description, icon, color, task_count, agent_count) VALUES
      ('Deal Hunter', 'Dutch grocery deal scraper and price tracker', '🛒', 'green', 5, 2),
      ('User Story Generator', 'AI-powered user story creation tool', '📝', 'purple', 3, 1),
      ('Personal Website', 'Portfolio and blog site redesign', '🌐', 'blue', 2, 0)
    `);
    seedProjects.run();

    const seedAgents = db.prepare(`
      INSERT INTO agents (name, type, status, skills) VALUES
      ('Yordamchi', 'openclaw', 'idle', 'typescript,scraping,api,fullstack'),
      ('Claude Code', 'codex', 'idle', 'typescript,python,architecture'),
      ('Gemini', 'openclaw', 'idle', 'javascript,react,ui'),
      ('Telegram Bot #1', 'telegram', 'idle', 'notifications,messaging')
    `);
    seedAgents.run();

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

    const seedActivities = db.prepare(`
      INSERT INTO activities (agent_id, task_id, project_id, action, message) VALUES
      (1, 2, 1, 'completed', 'Successfully added AH API scraper with 41 deals'),
      (2, 1, 1, 'started', 'Working on image extraction for Lidl scraper'),
      (1, 3, 1, 'completed', 'Deployed v1.0 to production 🚀'),
      (4, null, 1, 'notification', 'Daily summary: 630 deals active across 6 stores')
    `);
    seedActivities.run();
  }

  return db;
}
