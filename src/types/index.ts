/**
 * Shared domain types for the Agent Fleet Dashboard.
 *
 * These mirror the SQLite schema in `src/lib/db.ts`. Rows come back from
 * better-sqlite3 untyped, and the API serialises them to JSON as-is, so these
 * interfaces describe the shape consumed on the client. JSON columns
 * (`skills`, `cli_args`, `worktree_paths`, `dag_json`, `canvas_data`) arrive as
 * strings and must be parsed at the boundary.
 */

export type ProjectStatus = 'active' | 'archived' | 'paused' | string;
export type AgentStatus = 'idle' | 'busy' | 'error' | string;
export type TaskStatus = 'backlog' | 'in_progress' | 'done' | 'failed' | string;
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | string;
export type RunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'terminated'
  | string;
export type OutputType = 'stdout' | 'stderr';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  status: ProjectStatus;
  task_count: number;
  agent_count: number;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: number;
  name: string;
  type: string;
  status: AgentStatus;
  skills: string | null;
  config: string | null;
  current_task_id: number | null;
  cli_command: string | null;
  cli_args: string | null;
  working_dir: string | null;
  worktree_paths: string | null;
  cost_per_1k_tokens: number;
  total_tokens_used: number;
  total_cost: number;
  created_at: string;
  // Joined columns surfaced by some endpoints
  current_task_title?: string | null;
  current_project_name?: string | null;
  current_run_id?: number | null;
  run_status?: RunStatus | null;
  run_exit_code?: number | null;
}

export interface Task {
  id: number;
  project_id: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_agent_id: number | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  // Joined columns (from the dashboard/list queries)
  project_name?: string | null;
  project_icon?: string | null;
  agent_name?: string | null;
}

export interface Activity {
  id: number;
  agent_id: number | null;
  task_id: number | null;
  project_id: number | null;
  action: string;
  message: string | null;
  created_at: string;
  // Joined columns
  agent_name?: string | null;
  task_title?: string | null;
  project_name?: string | null;
}

export interface AgentRun {
  id: number;
  agent_id: number;
  task_id: number | null;
  project_id: number | null;
  command: string;
  status: RunStatus;
  pid: number | null;
  exit_code: number | null;
  stdout: string | null;
  stderr: string | null;
  started_at: string;
  completed_at: string | null;
  run_cwd: string | null;
  // Joined columns
  agent_name?: string | null;
  task_title?: string | null;
}

export interface AgentOutput {
  id: number;
  run_id: number;
  type: OutputType;
  content: string;
  created_at: string;
}

export interface TaskTemplate {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  priority: TaskPriority;
  default_agent_type: string | null;
  prompt_template: string | null;
  created_at: string;
}

export interface DagWorkflow {
  id: number;
  name: string;
  description: string | null;
  dag_json: string;
  created_at: string;
}

export interface DagExecution {
  id: number;
  workflow_id: number;
  status: RunStatus;
  started_at: string;
  completed_at: string | null;
  canvas_data: string | null;
}

/** Shape returned by `GET /api/dashboard`. */
export interface DashboardData {
  projects: Project[];
  agents: Agent[];
  tasks: Task[];
  activities: Activity[];
  stats?: DashboardStats;
}

export interface DashboardStats {
  total_projects: number;
  total_agents: number;
  total_tasks: number;
  active_agents: number;
  [key: string]: number;
}

/** Payload emitted by FleetDispatcher when dispatching a single agent. */
export interface DispatchPayload {
  projectId: string;
  agentId: string;
  prompt: string;
  priority: TaskPriority;
  cwd?: string;
}

/** Payload emitted by FleetDispatcher when dispatching a DAG workflow. */
export interface DagDispatchPayload extends DispatchPayload {
  workflowId: string;
}
