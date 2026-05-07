export function MobileAgentCard({ agent }: { agent: any }) {
  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    idle: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    busy: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
    error: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
    away: { bg: 'bg-zinc-700/50', text: 'text-zinc-400', dot: 'bg-zinc-500' },
  };

  const status = statusColors[agent.status] || statusColors.idle;
  const typeIcons: Record<string, string> = {
    openclaw: '🧠',
    codex: '💻',
    telegram: '📱',
    custom: '⚙️',
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 active:scale-[0.98] transition-transform min-w-[140px]">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-2xl shadow-lg">
            {typeIcons[agent.type] || '⚙️'}
          </div>
          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${status.dot} ring-2 ring-zinc-900`} />
        </div>
        <p className="font-semibold text-sm mt-2">{agent.name}</p>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${status.bg} ${status.text}`}>
          {agent.status}
        </span>
        {agent.current_task_id && (
          <p className="text-[10px] text-zinc-500 mt-1 truncate max-w-[120px]">
            Task #{agent.current_task_id}
          </p>
        )}
      </div>
    </div>
  );
}
