'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const input =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    type: 'openclaw',
    skills: '',
    cli_command: '',
    cli_args: '[]',
    working_dir: '',
    worktree_paths: '[]',
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch('/api/agents');
    setAgents(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      let cli_args: unknown[] = [];
      try {
        cli_args = JSON.parse(form.cli_args || '[]');
      } catch {
        cli_args = [];
      }
      let worktree_paths: unknown[] = [];
      try {
        const w = JSON.parse(form.worktree_paths || '[]');
        if (Array.isArray(w)) worktree_paths = w.filter((x) => typeof x === 'string' && String(x).trim());
      } catch {
        worktree_paths = [];
      }
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          skills: form.skills || null,
          cli_command: form.cli_command || null,
          cli_args,
          working_dir: form.working_dir || null,
          worktree_paths,
        }),
      });
      setForm({ name: '', type: 'openclaw', skills: '', cli_command: '', cli_args: '[]', working_dir: '', worktree_paths: '[]' });
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading agents…</div>;
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure CLI fleet members and open an agent for edits.</p>
        </div>
      </div>

      <form onSubmit={create} className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Add agent</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select className={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {['openclaw', 'codex', 'telegram', 'custom'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
            <input className={input} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CLI command</label>
            <input className={input} value={form.cli_command} onChange={(e) => setForm({ ...form, cli_command: e.target.value })} placeholder="e.g. claude" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CLI args (JSON array)</label>
            <input className={input} value={form.cli_args} onChange={(e) => setForm({ ...form, cli_args: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Working directory</label>
            <input className={input} value={form.working_dir} onChange={(e) => setForm({ ...form, working_dir: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Worktree paths (JSON array)</label>
            <textarea
              className={`${input} font-mono text-xs min-h-[80px]`}
              value={form.worktree_paths}
              onChange={(e) => setForm({ ...form, worktree_paths: e.target.value })}
              placeholder='["/abs/path/to/repo-wt-feature"]'
            />
          </div>
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium disabled:opacity-50">
          {saving ? 'Creating…' : 'Create agent'}
        </button>
      </form>

      <ul className="space-y-2">
        {agents.map((a) => (
          <li key={a.id}>
            <Link
              href={`/agents/${a.id}`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{a.name}</p>
                <p className="text-xs text-gray-500">
                  {a.type} · {a.status}
                  {a.current_task_title ? ` · ${a.current_task_title}` : ''}
                </p>
              </div>
              <span className="text-xs text-gray-400">#{a.id}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
