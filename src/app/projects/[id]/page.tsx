'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { Project, Task } from '@/types';

const input =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<{ project: Project; tasks: Task[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) {
      setData(null);
      setLoading(false);
      return;
    }
    setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description') || null,
          icon: form.get('icon'),
          color: form.get('color'),
          status: form.get('status'),
          task_count: parseInt(String(form.get('task_count')), 10) || 0,
          agent_count: parseInt(String(form.get('agent_count')), 10) || 0,
        }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this project? Tasks will be unlinked from the project.')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    router.push('/projects');
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading…</div>;
  }
  if (!data?.project) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-600">Project not found.</p>
        <Link href="/projects" className="text-blue-600 text-sm mt-2 inline-block">
          ← Projects
        </Link>
      </div>
    );
  }

  const { project, tasks } = data;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>{project.icon}</span> {project.name}
            </h1>
            <p className="text-sm text-gray-500">Project #{project.id}</p>
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

      <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 mb-10">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input name="name" className={input} defaultValue={project.name} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <input name="icon" className={input} defaultValue={project.icon} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input name="color" className={input} defaultValue={project.color} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" className={input} defaultValue={project.status}>
              {['active', 'paused', 'stuck', 'completed'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task count (display)</label>
            <input name="task_count" type="number" className={input} defaultValue={project.task_count} min={0} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent count (display)</label>
            <input name="agent_count" type="number" className={input} defaultValue={project.agent_count} min={0} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" className={`${input} min-h-[100px]`} defaultValue={project.description || ''} />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Tasks in this project</h2>
      <ul className="space-y-2">
        {tasks?.length ? (
          tasks.map((t) => (
            <li key={t.id}>
              <Link href={`/tasks/${t.id}`} className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200">
                <p className="font-medium text-gray-900 text-sm">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.status} · {t.agent_name || 'Unassigned'}</p>
              </Link>
            </li>
          ))
        ) : (
          <p className="text-sm text-gray-500">No tasks linked to this project.</p>
        )}
      </ul>
    </div>
  );
}
