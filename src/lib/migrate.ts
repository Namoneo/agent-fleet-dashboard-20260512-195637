import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database) {
  // Agent runs table - tracks actual CLI executions
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

  // Agent outputs - streaming logs
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

  // Task templates
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

  // Update agents table with CLI-specific fields
  try {
    db.exec(`ALTER TABLE agents ADD COLUMN cli_command TEXT`);
  } catch (e) { /* already exists */ }
  
  try {
    db.exec(`ALTER TABLE agents ADD COLUMN cli_args TEXT DEFAULT '[]'`);
  } catch (e) { /* already exists */ }

  try {
    db.exec(`ALTER TABLE agents ADD COLUMN working_dir TEXT`);
  } catch (e) { /* already exists */ }

  try {
    db.exec(`ALTER TABLE agents ADD COLUMN cost_per_1k_tokens REAL DEFAULT 0`);
  } catch (e) { /* already exists */ }

  try {
    db.exec(`ALTER TABLE agents ADD COLUMN total_tokens_used INTEGER DEFAULT 0`);
  } catch (e) { /* already exists */ }

  try {
    db.exec(`ALTER TABLE agents ADD COLUMN total_cost REAL DEFAULT 0`);
  } catch (e) { /* already exists */ }

  console.log('✅ Migrations completed');
}
