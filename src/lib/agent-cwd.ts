import { relative, resolve } from 'path';

export type AgentCwdFields = {
  working_dir: string | null;
  worktree_paths: string | null;
};

/** Absolute, normalized paths: `working_dir` first, then unique entries from `worktree_paths` JSON array. */
export function listAgentCwdRoots(agent: AgentCwdFields): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (raw: string | null | undefined) => {
    if (!raw?.trim()) return;
    const n = resolve(raw.trim());
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  };
  push(agent.working_dir);
  try {
    const extra = JSON.parse(agent.worktree_paths || '[]');
    if (Array.isArray(extra)) {
      for (const item of extra) {
        if (typeof item === 'string') push(item);
      }
    }
  } catch {
    /* ignore invalid JSON */
  }
  return out;
}

function isUnderAnyRoot(roots: string[], candidateAbs: string): boolean {
  for (const root of roots) {
    if (candidateAbs === root) return true;
    const rel = relative(root, candidateAbs);
    if (!rel || rel === '.') return true;
    if (!rel.startsWith('..')) return true;
  }
  return false;
}

/**
 * Picks the directory for `spawn({ cwd })`.
 * - If `requestedCwd` is empty: default is first configured root (working_dir, else first worktree, else cwd).
 * - If `requestedCwd` is set: must lie under one of the agent roots (or under process.cwd() when no roots).
 */
export function resolveAgentSpawnCwd(
  agent: AgentCwdFields,
  requestedCwd: string | null | undefined
): { ok: true; cwd: string } | { ok: false; error: string } {
  const roots = listAgentCwdRoots(agent);
  const effectiveRoots = roots.length > 0 ? roots : [resolve(process.cwd())];
  const defaultCwd = effectiveRoots[0];

  const raw = requestedCwd?.trim();
  if (!raw) {
    return { ok: true, cwd: defaultCwd };
  }

  const chosen = resolve(raw);
  if (!isUnderAnyRoot(effectiveRoots, chosen)) {
    return {
      ok: false,
      error: `cwd must be this agent's working_dir or one of its worktree_paths (got: ${chosen})`,
    };
  }
  return { ok: true, cwd: chosen };
}
