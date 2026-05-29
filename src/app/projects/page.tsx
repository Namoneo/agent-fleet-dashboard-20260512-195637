'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import type { Project } from '@/types';

const input =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📁');
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch('/api/projects');
    setProjects(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description, icon }),
      });
      setName('');
      setDescription('');
      setIcon('📁');
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading projects…</div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/"
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
          aria-label="Back to overview"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and open any project for full editing.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New project
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Repo or product name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
            <input className={input} value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={8} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className={`${input} resize-none min-h-[80px]`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this project is for"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Create project'}
        </button>
      </form>

      <ul className="space-y-2">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/projects/${p.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <span className="text-2xl">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500 truncate">{p.description || 'No description'}</p>
              </div>
              <span className="text-xs text-gray-400">{p.status}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
