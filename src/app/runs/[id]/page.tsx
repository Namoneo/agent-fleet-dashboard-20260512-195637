'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Terminal } from 'lucide-react';
import type { AgentRun, AgentOutput } from '@/types';

export default function RunDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [run, setRun] = useState<AgentRun | null>(null);
  const [logs, setLogs] = useState<AgentOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [rRes, oRes] = await Promise.all([fetch(`/api/runs/${id}`), fetch(`/api/runs/${id}/output`)]);
      if (cancelled) return;
      if (rRes.ok) {
        setRun(await rRes.json());
      } else {
        setRun(null);
      }
      if (oRes.ok) {
        setLogs(await oRes.json());
      } else {
        setLogs([]);
      }
      setLoading(false);
    }
    load();
    const t = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [id]);

  if (loading && !run) {
    return <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">Loading run…</div>;
  }
  if (!run) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-600">Run not found.</p>
        <Link href="/agents" className="text-blue-600 text-sm mt-2 inline-block">
          ← Agents
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/agents/${run.agent_id}`} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Run #{run.id}</h1>
            <p className="text-sm text-gray-500">
              {run.agent_name}
              {run.task_title ? ` · ${run.task_title}` : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-zinc-950 p-4 mb-4">
        <p className="text-xs text-zinc-500 font-mono break-all">{run.command}</p>
        <p className="text-xs text-zinc-400 mt-2">
          Status: {run.status}
          {run.exit_code != null ? ` · exit ${run.exit_code}` : ''}
        </p>
        {run.run_cwd && (
          <p className="text-xs text-zinc-500 mt-1 font-mono break-all">
            cwd: {run.run_cwd}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 max-h-[60vh] overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-zinc-500">No streamed output yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={log.type === 'stderr' ? 'text-red-400' : ''}>
              {log.content}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
