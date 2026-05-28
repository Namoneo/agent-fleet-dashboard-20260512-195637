'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { DagWorkflow } from '@/types';

const input =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [wf, setWf] = useState<DagWorkflow | null>(null);
  const [dagJson, setDagJson] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch(`/api/dag/${id}`);
    if (!res.ok) {
      setWf(null);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setWf(data);
    setDagJson(JSON.stringify(data.dag ?? {}, null, 2));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    let dag: unknown;
    try {
      dag = JSON.parse(dagJson);
    } catch {
      setError('DAG JSON is invalid');
      return;
    }
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const res = await fetch(`/api/dag/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description') || null,
          dag,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWf(data);
        setDagJson(JSON.stringify(data.dag ?? {}, null, 2));
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this workflow?')) return;
    await fetch(`/api/dag/${id}`, { method: 'DELETE' });
    router.push('/workflows');
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading…</div>;
  }
  if (!wf) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-600">Workflow not found.</p>
        <Link href="/workflows" className="text-blue-600 text-sm mt-2 inline-block">
          ← Workflows
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/workflows" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{wf.name}</h1>
            <p className="text-sm text-gray-500">Workflow #{wf.id}</p>
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input name="name" className={input} defaultValue={wf.name} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" className={`${input} min-h-[72px]`} defaultValue={wf.description || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DAG (JSON)</label>
          <textarea className={`${input} min-h-[240px] font-mono text-xs`} value={dagJson} onChange={(e) => setDagJson(e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save workflow'}
        </button>
      </form>
    </div>
  );
}
