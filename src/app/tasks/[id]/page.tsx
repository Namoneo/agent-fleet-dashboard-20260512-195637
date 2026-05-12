'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';

const input =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [task, setTask] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [tRes, pRes, aRes] = await Promise.all([
      fetch(`/api/tasks/${id}`),
      fetch('/api/projects'),
      fetch('/api/agents'),
    ]);
    if (!tRes.ok) {
      setTask(null);
      setLoading(false);
      return;
    }
    setTask(await tRes.json());
    setProjects(await pRes.json());
    setAgents(await aRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.get('title'),
          description: form.get('description') || null,
          status: form.get('status'),
          priority: form.get('priority'),
          project_id: form.get('project_id') === '' ? null : parseInt(String(form.get('project_id')), 10),
          assigned_agent_id: form.get('assigned_agent_id') === '' ? null : parseInt(String(form.get('assigned_agent_id')), 10),
          due_date: form.get('due_date') === '' ? null : form.get('due_date'),
        }),
      });
      if (res.ok) setTask(await res.json());
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    router.push('/tasks');
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading…</div>;
  }
  if (!task) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-600">Task not found.</p>
        <Link href="/tasks" className="text-blue-600 text-sm mt-2 inline-block">
          ← Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/tasks" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit task</h1>
            <p className="text-sm text-gray-500">#{task.id}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={remove}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 text-red-700 text-sm hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>

      <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input name="title" className={input} defaultValue={task.title} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" className={`${input} min-h-[120px]`} defaultValue={task.description || ''} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" className={input} defaultValue={task.status}>
              {['backlog', 'in_progress', 'review', 'done', 'blocked', 'failed'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select name="priority" className={input} defaultValue={task.priority}>
              {['low', 'medium', 'high', 'urgent'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select name="project_id" className={input} defaultValue={task.project_id ?? ''}>
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned agent</label>
            <select name="assigned_agent_id" className={input} defaultValue={task.assigned_agent_id ?? ''}>
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
            <input name="due_date" type="datetime-local" className={input} defaultValue={task.due_date ? task.due_date.slice(0, 16) : ''} />
          </div>
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
