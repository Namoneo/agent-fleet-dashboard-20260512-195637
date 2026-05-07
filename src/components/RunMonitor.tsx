'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Terminal, Play, Square, RefreshCw, ExternalLink } from 'lucide-react';

interface RunMonitorProps {
  runId: string;
  agentName: string;
  taskTitle: string;
  onClose: () => void;
}

export function RunMonitor({ runId, agentName, taskTitle, onClose }: RunMonitorProps) {
  const [logs, setLogs] = useState<{ id: number, type: string, content: string }[]>([]);
  const [status, setStatus] = useState('running');
  const scrollRef = useRef<<HTMLHTMLDivElement>(null);

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
    const interval = setInterval(fetchLogs, 2000); // Poll logs every 2s
    return () => clearInterval(interval);
  }, [runId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <<divdiv className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <<divdiv className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-zinc-800 animate-slide-up">
        {/* Header */}
        <<divdiv className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <<divdiv className="flex items-center gap-3">
            <<divdiv className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <<TerminalTerminal className="w-4 h-4" />
            </div>
            <div>
              <<hh3 className="text-sm font-bold text-zinc-100">Agent Console: {agentName}</h3>
              <<pp className="text-xs text-zinc-500">{taskTitle}</p>
            </div>
          </div>
          <<divdiv className="flex items-center gap-3">
            <<divdiv className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700">
              <<spanspan className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <<spanspan className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Live</span>
            </div>
            <<buttonbutton onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
              <<XX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal Area */}
        <<divdiv 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed scroll-smooth"
          style={{ background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)' }}
        >
          {logs.length === 0 ? (
            <<divdiv className="h-full flex flex-col items-center justify-center text-zinc-600 gap-3">
              <<TerminalTerminal className="w-12 h-12 opacity-20" />
              <<pp>Waiting for agent output...</p>
            </div>
          ) : (
            <<divdiv className="space-y-1">
              {logs.map((log) => (
                <<divdiv key={log.id} className="flex gap-3 group">
                  <<spanspan className="text-zinc-600 select-none w-8 text-right">
                    {log.type === 'stdout' ? '➜' : '⚠'}
                  </span>
                  <<spanspan className={log.type === 'stderr' ? 'text-red-400' : 'text-zinc-300'}>
                    {log.content}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <<divdiv className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <<divdiv className="flex items-center gap-2">
            <<buttonbutton className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors border border-zinc-700">
              <<RefreshRefreshCw className="w-3 h-3" />
              Refresh Logs
            </button>
          </div>
          <<divdiv className="flex items-center gap-3">
            <<buttonbutton className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-lg shadow-red-900/20">
              Terminate Process
            </button>
            <<buttonbutton className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-900/20">
              Open Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
