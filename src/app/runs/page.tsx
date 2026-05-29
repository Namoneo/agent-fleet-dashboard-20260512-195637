'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Terminal } from 'lucide-react';
import type { AgentRun, RunStatus } from '@/types';

const STATUS_STYLES: Record<string, string> = {
  running: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  terminated: 'bg-gray-200 text-gray-600',
};

function statusClass(status: RunStatus): string {
  return STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600';
}

export default function RunsPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/runs');
        if (!res.ok) throw new Error(`Failed to load runs (${res.status})`);
        const data: AgentRun[] = await res.json();
        if (!cancelled) {
          setRuns(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load runs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Runs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Recent CLI executions across the fleet.</p>
        </div>
      </div>

      {loading && runs.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Loading runs…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
          <Terminal className="w-10 h-10 opacity-30" />
          <p className="text-sm">No runs yet. Dispatch an agent to get started.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {runs.map((run) => (
            <li key={run.id}>
              <Link
                href={`/runs/${run.id}`}
                className="flex items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {run.agent_name ?? `Agent #${run.agent_id}`}
                    {run.task_title ? <span className="text-gray-400"> · {run.task_title}</span> : null}
                  </p>
                  <p className="text-xs text-gray-500 font-mono truncate">{run.command}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(run.status)}`}>
                    {run.status}
                  </span>
                  <span className="text-xs text-gray-400">#{run.id}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
