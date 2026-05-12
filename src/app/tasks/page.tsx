'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks')
      .then((r) => r.json())
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'active') return t.status !== 'done';
    return t.status === filter;
  });

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading tasks…</div>;
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Open any task to edit fields and assignment.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: 'active', label: 'Active' },
          { key: 'in_progress', label: 'In progress' },
          { key: 'done', label: 'Done' },
          { key: 'all', label: 'All' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filter === tab.key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((t) => (
          <li key={t.id}>
            <Link href={`/tasks/${t.id}`} className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200">
              <p className="font-medium text-gray-900">{t.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t.status} · {t.priority}
                {t.project_name ? ` · ${t.project_name}` : ''}
                {t.agent_name ? ` · ${t.agent_name}` : ''}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
