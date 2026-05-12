'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dag')
      .then((r) => r.json())
      .then(setWorkflows)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading workflows…</div>;
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">DAG workflows</h1>
          <p className="text-sm text-gray-500 mt-0.5">Edit graph JSON and metadata. Create new workflows via API or seed scripts for now.</p>
        </div>
      </div>

      <ul className="space-y-2">
        {workflows.map((w) => (
          <li key={w.id}>
            <Link href={`/workflows/${w.id}`} className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200">
              <p className="font-medium text-gray-900">{w.name}</p>
              <p className="text-xs text-gray-500 mt-1">{w.description || 'No description'}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
