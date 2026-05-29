import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';

function resolveDbPath(): string {
  const fromEnv = process.env.DASHBOARD_DB_PATH;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return resolve(fromEnv.trim());
  }
  return join(process.cwd(), '.data', 'dashboard.db');
}

let db: Database.Database | null = null;

/** Lightweight ALTERs for existing DBs; safe to run repeatedly. */
function patchAgentWorktreeSchema(database: Database.Database) {
  try {
    database.exec(`ALTER TABLE agents ADD COLUMN worktree_paths TEXT`);
  } catch {
    /* column exists */
  }
  try {
    database.exec(`ALTER TABLE agent_runs ADD COLUMN run_cwd TEXT`);
  } catch {
    /* column exists */
  }
}

/**
 * Indexes on foreign keys and hot filter/sort columns. All use
 * `IF NOT EXISTS` and `CREATE INDEX` on a missing table is wrapped in
 * try/catch, so this is safe to run on every connection.
 */
function ensureIndexes(database: Database.Database) {
  const statements = [
    // tasks: filtered by project, agent, and status; sorted by created_at
    `CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_assigned_agent_id ON tasks(assigned_agent_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
    // agent_runs: looked up by agent/task, sorted by started_at, joined on status
    `CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id ON agent_runs(agent_id)`,
    `CREATE INDEX IF NOT EXISTS idx_agent_runs_task_id ON agent_runs(task_id)`,
    `CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status)`,
    `CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON agent_runs(started_at DESC)`,
    // agent_outputs: always queried by run_id, ordered by created_at
    `CREATE INDEX IF NOT EXISTS idx_agent_outputs_run_id ON agent_outputs(run_id)`,
    // activities: filtered by agent/task/project, sorted by created_at
    `CREATE INDEX IF NOT EXISTS idx_activities_agent_id ON activities(agent_id)`,
    `CREATE INDEX IF NOT EXISTS idx_activities_task_id ON activities(task_id)`,
    `CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC)`,
    // dag_executions: looked up by workflow
    `CREATE INDEX IF NOT EXISTS idx_dag_executions_workflow_id ON dag_executions(workflow_id)`,
  ];
  for (const sql of statements) {
    try {
      database.exec(sql);
    } catch {
      /* table not created yet — initDb() will create indexes after schema setup */
    }
  }
}

export function getDb() {
  if (!db) {
    const dbPath = resolveDbPath();
    mkdirSync(dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    patchAgentWorktreeSchema(db);
    ensureIndexes(db);
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
      worktree_paths TEXT,
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
      run_cwd TEXT,
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

  // NEW: DAG workflows (Cursor cookbook integration)
  db.exec(`
    CREATE TABLE IF NOT EXISTS dag_workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      dag_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // NEW: DAG executions for live canvas
  db.exec(`
    CREATE TABLE IF NOT EXISTS dag_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      canvas_data TEXT,
      FOREIGN KEY (workflow_id) REFERENCES dag_workflows(id)
    )
  `);

  // Indexes (tables now exist; ensureIndexes in getDb runs before initDb on a fresh DB)
  ensureIndexes(db);

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

  // Seed DAG workflows (Cursor cookbook format)
  seedDagWorkflows(db);
}

function updateAgentCommands(db: Database.Database) {
  const agents = db
    .prepare('SELECT id, name, type FROM agents WHERE cli_command IS NULL')
    .all() as { id: number; name: string; type: string }[];

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

function seedDagWorkflows(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as count FROM dag_workflows').get() as { count: number };
  if (count.count > 0) return;

  const workflows = [
    {
      name: 'Bug Fix',
      description: 'Systematic bug investigation and resolution workflow',
      dag_json: JSON.stringify({
        title: 'Bug Fix Workflow',
        models: { HIGH: 'gpt-4', MED: 'claude-3-opus', LOW: 'auto-low' },
        tasks: [
          {
            id: 'analyze-bug',
            depends_on: [],
            complexity: 'MED',
            subtask_prompt: 'Analyze the reported bug. Read error logs, stack traces, and related code. Identify the root cause and affected components. Document your findings.'
          },
          {
            id: 'reproduce-bug',
            depends_on: ['analyze-bug'],
            complexity: 'MED',
            subtask_prompt: 'Create a minimal reproduction case for the bug. Write a test that fails due to the bug, or document exact steps to reproduce it reliably.'
          },
          {
            id: 'implement-fix',
            depends_on: ['reproduce-bug'],
            complexity: 'HIGH',
            subtask_prompt: 'Implement the fix for the bug based on your analysis. Write clean, minimal code changes. Ensure the fix addresses the root cause, not just symptoms.'
          },
          {
            id: 'test-fix',
            depends_on: ['implement-fix'],
            complexity: 'MED',
            subtask_prompt: 'Verify the fix works. Run the reproduction test to confirm it now passes. Add regression tests to prevent this bug from recurring.'
          },
          {
            id: 'document-fix',
            depends_on: ['test-fix'],
            complexity: 'LOW',
            subtask_prompt: 'Document what was fixed. Update CHANGELOG, add code comments if needed, and write a brief summary of the changes made.'
          }
        ]
      })
    },
    {
      name: 'Feature',
      description: 'End-to-end feature development workflow',
      dag_json: JSON.stringify({
        title: 'Feature Development Workflow',
        models: { HIGH: 'gpt-4', MED: 'claude-3-opus', LOW: 'auto-low' },
        tasks: [
          {
            id: 'design-feature',
            depends_on: [],
            complexity: 'HIGH',
            subtask_prompt: 'Design the feature architecture. Define the API, data models, and component structure. Create a technical specification document with implementation plan.'
          },
          {
            id: 'setup-structure',
            depends_on: ['design-feature'],
            complexity: 'LOW',
            subtask_prompt: 'Set up the basic file structure, routes, and boilerplate code for the feature. Create placeholder components and API endpoints.'
          },
          {
            id: 'implement-backend',
            depends_on: ['setup-structure'],
            complexity: 'HIGH',
            subtask_prompt: 'Implement the backend/API functionality. Write server-side logic, database queries, and API endpoints. Include validation and error handling.'
          },
          {
            id: 'implement-frontend',
            depends_on: ['setup-structure'],
            complexity: 'HIGH',
            subtask_prompt: 'Implement the frontend UI components. Build responsive interfaces, forms, and user interactions. Connect to backend APIs.'
          },
          {
            id: 'integrate-feature',
            depends_on: ['implement-backend', 'implement-frontend'],
            complexity: 'MED',
            subtask_prompt: 'Integrate frontend and backend. Wire up API calls, handle loading states and errors. Ensure end-to-end functionality works correctly.'
          },
          {
            id: 'test-feature',
            depends_on: ['integrate-feature'],
            complexity: 'MED',
            subtask_prompt: 'Write comprehensive tests. Include unit tests for logic, integration tests for APIs, and e2e tests for critical user flows.'
          },
          {
            id: 'polish-feature',
            depends_on: ['test-feature'],
            complexity: 'LOW',
            subtask_prompt: 'Polish the feature. Add loading states, error boundaries, animations, and edge case handling. Ensure accessibility and mobile responsiveness.'
          }
        ]
      })
    },
    {
      name: 'Refactor',
      description: 'Code quality improvement without behavior changes',
      dag_json: JSON.stringify({
        title: 'Refactoring Workflow',
        models: { HIGH: 'gpt-4', MED: 'claude-3-opus', LOW: 'auto-low' },
        tasks: [
          {
            id: 'analyze-code',
            depends_on: [],
            complexity: 'MED',
            subtask_prompt: 'Analyze the current codebase for refactoring opportunities. Identify code smells, duplication, and areas for improvement. Document the current state.'
          },
          {
            id: 'plan-refactor',
            depends_on: ['analyze-code'],
            complexity: 'MED',
            subtask_prompt: 'Plan the refactoring approach. Define the target architecture, identify breaking changes, and create a step-by-step migration plan.'
          },
          {
            id: 'extract-components',
            depends_on: ['plan-refactor'],
            complexity: 'MED',
            subtask_prompt: 'Extract reusable components and utilities. Break down large components, create shared hooks, and consolidate duplicated logic.'
          },
          {
            id: 'improve-types',
            depends_on: ['plan-refactor'],
            complexity: 'LOW',
            subtask_prompt: 'Improve TypeScript types and interfaces. Add strict typing, remove any types, and ensure type safety across the codebase.'
          },
          {
            id: 'optimize-performance',
            depends_on: ['extract-components'],
            complexity: 'HIGH',
            subtask_prompt: 'Optimize performance. Identify bottlenecks, add memoization, lazy load components, and optimize database queries or API calls.'
          },
          {
            id: 'verify-behavior',
            depends_on: ['improve-types', 'optimize-performance'],
            complexity: 'MED',
            subtask_prompt: 'Verify behavior is unchanged. Run all existing tests, perform manual testing, and ensure no regressions were introduced.'
          }
        ]
      })
    },
    {
      name: 'Code Review',
      description: 'Comprehensive code review and quality assurance',
      dag_json: JSON.stringify({
        title: 'Code Review Workflow',
        models: { HIGH: 'gpt-4', MED: 'claude-3-opus', LOW: 'auto-low' },
        tasks: [
          {
            id: 'review-structure',
            depends_on: [],
            complexity: 'LOW',
            subtask_prompt: 'Review code structure and organization. Check file organization, naming conventions, and module boundaries. Ensure consistency with project standards.'
          },
          {
            id: 'check-logic',
            depends_on: ['review-structure'],
            complexity: 'HIGH',
            subtask_prompt: 'Review business logic and algorithms. Check for correctness, edge cases, and potential bugs. Verify logic matches requirements.'
          },
          {
            id: 'check-security',
            depends_on: ['check-logic'],
            complexity: 'HIGH',
            subtask_prompt: 'Security review. Check for injection vulnerabilities, XSS, CSRF, authentication issues, and data exposure. Verify input validation and sanitization.'
          },
          {
            id: 'check-performance',
            depends_on: ['check-logic'],
            complexity: 'MED',
            subtask_prompt: 'Performance review. Check for N+1 queries, unnecessary re-renders, memory leaks, and inefficient algorithms. Suggest optimizations.'
          },
          {
            id: 'check-testing',
            depends_on: ['check-security', 'check-performance'],
            complexity: 'MED',
            subtask_prompt: 'Review test coverage. Check that critical paths are tested, tests are meaningful, and edge cases are covered. Suggest additional tests if needed.'
          },
          {
            id: 'summarize-review',
            depends_on: ['check-testing'],
            complexity: 'LOW',
            subtask_prompt: 'Summarize findings. Categorize issues by severity (critical/major/minor), provide actionable feedback, and highlight positive aspects of the code.'
          }
        ]
      })
    },
    {
      name: 'Documentation',
      description: 'Create comprehensive documentation',
      dag_json: JSON.stringify({
        title: 'Documentation Workflow',
        models: { HIGH: 'gpt-4', MED: 'claude-3-opus', LOW: 'auto-low' },
        tasks: [
          {
            id: 'analyze-audience',
            depends_on: [],
            complexity: 'LOW',
            subtask_prompt: 'Analyze the target audience for documentation. Identify user personas, their technical level, and what information they need. Define documentation scope.'
          },
          {
            id: 'outline-structure',
            depends_on: ['analyze-audience'],
            complexity: 'LOW',
            subtask_prompt: 'Create documentation outline. Define sections, topics, and organization. Plan for README, API docs, guides, and examples.'
          },
          {
            id: 'write-overview',
            depends_on: ['outline-structure'],
            complexity: 'MED',
            subtask_prompt: 'Write overview and getting started sections. Explain what the project does, key features, installation steps, and quick start guide.'
          },
          {
            id: 'document-api',
            depends_on: ['outline-structure'],
            complexity: 'HIGH',
            subtask_prompt: 'Document APIs and interfaces. Include endpoint descriptions, request/response formats, authentication, error codes, and code examples.'
          },
          {
            id: 'write-guides',
            depends_on: ['write-overview'],
            complexity: 'MED',
            subtask_prompt: 'Write how-to guides and tutorials. Create step-by-step instructions for common tasks, with working code examples and screenshots if relevant.'
          },
          {
            id: 'add-examples',
            depends_on: ['document-api'],
            complexity: 'MED',
            subtask_prompt: 'Create practical examples. Write complete, runnable code examples that demonstrate key features and common use cases.'
          },
          {
            id: 'review-docs',
            depends_on: ['write-guides', 'add-examples'],
            complexity: 'LOW',
            subtask_prompt: 'Review and polish documentation. Check for clarity, completeness, accuracy, and consistency. Fix typos and formatting issues.'
          }
        ]
      })
    }
  ];

  const insert = db.prepare('INSERT INTO dag_workflows (name, description, dag_json) VALUES (?, ?, ?)');
  for (const wf of workflows) {
    insert.run(wf.name, wf.description, wf.dag_json);
  }
}
