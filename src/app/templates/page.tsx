'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const input =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt_template, setPrompt] = useState('');

  async function load() {
    const res = await fetch('/api/templates');
    setTemplates(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description,
          prompt_template,
          priority: 'medium',
          icon: '📋',
        }),
      });
      setName('');
      setDescription('');
      setPrompt('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading…</div>;
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Used by Fleet Dispatcher for repeatable prompts.</p>
        </div>
      </div>

      <form onSubmit={create} className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">New template</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input className={input} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prompt template</label>
          <textarea className={`${input} min-h-[100px]`} value={prompt_template} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Create template'}
        </button>
      </form>

      <ul className="space-y-2">
        {templates.map((t) => (
          <li key={t.id}>
            <Link href={`/templates/${t.id}`} className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200">
              <span className="text-lg mr-2">{t.icon}</span>
              <span className="font-medium text-gray-900">{t.name}</span>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description || t.prompt_template || '—'}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
