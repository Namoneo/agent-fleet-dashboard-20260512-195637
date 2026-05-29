import type { Agent } from '@/types';

export function MobileAgentCard({ agent, fullWidth = false }: { agent: Agent; fullWidth?: boolean }) {
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

  const handleClick = () => {
    alert(`Agent: ${agent.name}\nType: ${agent.type}\nStatus: ${agent.status}\nSkills: ${agent.skills || 'None'}`);
  };

  if (fullWidth) {
    return (
      <div 
        className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 active:scale-[0.98] transition-transform w-full"
        onClick={handleClick}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xl shadow-lg">
              {typeIcons[agent.type] || '⚙️'}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${status.dot} ring-2 ring-zinc-900`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{agent.name}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                {agent.status}
              </span>
            </div>
            {agent.skills && (
              <p className="text-xs text-zinc-500 mt-1 truncate">{agent.skills}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 active:scale-[0.98] transition-transform min-w-[140px]"
      onClick={handleClick}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg text-xl">
            {typeIcons[agent.type] || '⚙️'}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${status.dot} ring-2 ring-zinc-900`} />
        </div>
        <p className="font-semibold text-sm mt-2">{agent.name}</p>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${status.bg} ${status.text}`}>
          {agent.status}
        </span>
      </div>
    </div>
  );
}
