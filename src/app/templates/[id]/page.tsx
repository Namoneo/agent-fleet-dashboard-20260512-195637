'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';

const input =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [tpl, setTpl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/templates/${id}`);
    if (!res.ok) {
      setTpl(null);
      setLoading(false);
      return;
    }
    setTpl(await res.json());
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
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description') || null,
          icon: form.get('icon'),
          priority: form.get('priority'),
          default_agent_type: form.get('default_agent_type') || null,
          prompt_template: form.get('prompt_template') || null,
        }),
      });
      if (res.ok) setTpl(await res.json());
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this template?')) return;
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    router.push('/templates');
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading…</div>;
  }
  if (!tpl) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-600">Template not found.</p>
        <Link href="/templates" className="text-blue-600 text-sm mt-2 inline-block">
          ← Templates
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/templates" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tpl.name}</h1>
            <p className="text-sm text-gray-500">Template #{tpl.id}</p>
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
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input name="name" className={input} defaultValue={tpl.name} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <input name="icon" className={input} defaultValue={tpl.icon} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select name="priority" className={input} defaultValue={tpl.priority}>
              {['low', 'medium', 'high', 'urgent'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default agent type</label>
            <input name="default_agent_type" className={input} defaultValue={tpl.default_agent_type || ''} placeholder="e.g. openclaw" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input name="description" className={input} defaultValue={tpl.description || ''} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt template</label>
            <textarea name="prompt_template" className={`${input} min-h-[160px] font-mono text-xs`} defaultValue={tpl.prompt_template || ''} />
          </div>
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
