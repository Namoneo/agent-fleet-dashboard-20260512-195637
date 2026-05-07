'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Terminal, Loader2 } from 'lucide-react';

interface RunMonitorProps {
  runId: string;
  agentName: string;
  taskTitle: string;
  onClose: () => void;
}

export function RunMonitor({ runId, agentName, taskTitle, onClose }: RunMonitorProps) {
  const [logs, setLogs] = useState<{ id: number; type: string; content: string }[]>([]);
  const [status, setStatus] = useState('running');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/runs/${runId}/output`);
        const data = await res.json();
        setLogs(data);
      } catch (e) {
        console.error('Failed to fetch logs', e);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-zinc-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{agentName}</h3>
              <p className="text-xs text-zinc-500">{taskTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-zinc-400 uppercase">Live</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed scroll-smooth bg-zinc-950"
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-3">
              <Terminal className="w-12 h-12 opacity-20" />
              <p>Waiting for agent output...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <span className="text-zinc-600 select-none w-8 text-right">
                    {log.type === 'stdout' ? '➜' : '⚠'}
                  </span>
                  <span className={log.type === 'stderr' ? 'text-red-400' : 'text-zinc-300'}>
                    {log.content}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Run ID: {runId}
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors">
              Terminate
            </button>
            <button className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
              Open Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
