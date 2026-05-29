'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Activity } from '@/types';

export default function ActivityPage() {
  const [data, setData] = useState<{ activities: Activity[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activities?limit=100')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading activity…</div>;
  }

  const activities = data?.activities ?? [];

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
          <p className="text-sm text-gray-500 mt-0.5">Recent fleet events (newest first).</p>
        </div>
      </div>

      <ul className="space-y-2">
        {activities.map((a) => (
          <li key={a.id} className="p-4 bg-white rounded-xl border border-gray-100 text-sm">
            <p className="text-gray-900 font-medium">{a.action || 'event'}</p>
            <p className="text-gray-600 mt-1">{a.message}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
              <span>{new Date(a.created_at).toLocaleString()}</span>
              {a.agent_name && <span>· {a.agent_name}</span>}
              {a.task_id != null && a.task_title && (
                <span>
                  ·{' '}
                  <Link href={`/tasks/${a.task_id}`} className="text-blue-600 hover:underline">
                    {a.task_title}
                  </Link>
                </span>
              )}
              {a.project_name && <span>· {a.project_name}</span>}
            </div>
          </li>
        ))}
      </ul>
      {activities.length === 0 && <p className="text-sm text-gray-500">No activity yet.</p>}
    </div>
  );
}
