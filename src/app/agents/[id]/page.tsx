'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Terminal } from 'lucide-react';
import type { Agent, AgentRun } from '@/types';

const input =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<{ agent: Agent; runs: AgentRun[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cliArgsStr, setCliArgsStr] = useState('[]');
  const [worktreePathsStr, setWorktreePathsStr] = useState('[]');

  async function load() {
    const res = await fetch(`/api/agents/${id}`);
    if (!res.ok) {
      setData(null);
      setLoading(false);
      return;
    }
    const json = await res.json();
    setData(json);
    try {
      setCliArgsStr(JSON.stringify(json.agent?.cli_args ? JSON.parse(json.agent.cli_args) : [], null, 0));
    } catch {
      setCliArgsStr('[]');
    }
    try {
      const wt = json.agent?.worktree_paths ? JSON.parse(json.agent.worktree_paths) : [];
      setWorktreePathsStr(JSON.stringify(Array.isArray(wt) ? wt : [], null, 2));
    } catch {
      setWorktreePathsStr('[]');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;
    const form = new FormData(e.currentTarget);
    let cli_args: unknown[] = [];
    try {
      cli_args = JSON.parse(cliArgsStr || '[]');
    } catch {
      alert('CLI args must be valid JSON array');
      return;
    }
    let worktree_paths: string[] = [];
    try {
      const parsed = JSON.parse(worktreePathsStr || '[]');
      if (Array.isArray(parsed)) {
        worktree_paths = parsed.filter((x: unknown) => typeof x === 'string' && String(x).trim());
      }
    } catch {
      alert('Worktree paths must be a JSON array of absolute directory strings');
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          type: form.get('type'),
          status: form.get('status'),
          skills: form.get('skills') || null,
          cli_command: form.get('cli_command') || null,
          cli_args,
          working_dir: form.get('working_dir') || null,
          worktree_paths,
          cost_per_1k_tokens: parseFloat(String(form.get('cost_per_1k_tokens'))) || 0,
        }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading…</div>;
  }
  if (!data?.agent) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-600">Agent not found.</p>
        <Link href="/agents" className="text-blue-600 text-sm mt-2 inline-block">
          ← Agents
        </Link>
      </div>
    );
  }

  const { agent, runs } = data;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/agents" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
          <p className="text-sm text-gray-500">Agent #{agent.id}</p>
        </div>
      </div>

      <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 mb-10">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input name="name" className={input} defaultValue={agent.name} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select name="type" className={input} defaultValue={agent.type}>
              {['openclaw', 'codex', 'telegram', 'custom'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" className={input} defaultValue={agent.status}>
              {['idle', 'busy', 'error', 'away'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost / 1k tokens</label>
            <input name="cost_per_1k_tokens" type="number" step="0.01" className={input} defaultValue={agent.cost_per_1k_tokens ?? 0} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <input name="skills" className={input} defaultValue={agent.skills || ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CLI command</label>
            <input name="cli_command" className={input} defaultValue={agent.cli_command || ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Working directory</label>
            <input name="working_dir" className={input} defaultValue={agent.working_dir || ''} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Git worktree paths (JSON array of absolute paths)
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Sibling worktrees (not under <code className="text-gray-600">working_dir</code>) go here. Fleet Dispatcher lists{' '}
              <code className="text-gray-600">working_dir</code> plus these paths.
            </p>
            <textarea
              className={`${input} font-mono text-xs min-h-[100px]`}
              value={worktreePathsStr}
              onChange={(e) => setWorktreePathsStr(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">CLI args (JSON)</label>
            <textarea className={`${input} font-mono text-xs min-h-[72px]`} value={cliArgsStr} onChange={(e) => setCliArgsStr(e.target.value)} />
          </div>
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent runs</h2>
      <ul className="space-y-2">
        {runs?.length ? (
          runs.map((r) => (
            <li key={r.id}>
              <Link
                href={`/runs/${r.id}`}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200"
              >
                <Terminal className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.command}</p>
                  <p className="text-xs text-gray-500">
                    {r.status} {r.exit_code != null ? `· exit ${r.exit_code}` : ''} · {r.started_at}
                    {r.run_cwd ? ` · ${r.run_cwd}` : ''}
                  </p>
                </div>
              </Link>
            </li>
          ))
        ) : (
          <p className="text-sm text-gray-500">No runs yet.</p>
        )}
      </ul>
    </div>
  );
}
