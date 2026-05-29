import type { Task } from '@/types';

export function MobileTaskCard({ task }: { task: Task }) {
  const priorityColors: Record<string, string> = {
    low: 'bg-zinc-700 text-zinc-400',
    medium: 'bg-amber-500/20 text-amber-400',
    high: 'bg-orange-500/20 text-orange-400',
    urgent: 'bg-red-500/20 text-red-400',
  };

  const statusIcons: Record<string, string> = {
    backlog: '⏳',
    'in_progress': '🔄',
    done: '✅',
    failed: '❌',
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 active:scale-[0.98] transition-transform">
      <div className="flex items-start gap-3">
        <span className="text-lg">{statusIcons[task.status] || '📝'}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{task.title}</h3>
          {task.description && (
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityColors[task.priority] || priorityColors.medium}`}>
              {task.priority}
            </span>
            {task.project_name && (
              <span className="text-[10px] text-zinc-500">📁 {task.project_name}</span>
            )}
            {task.agent_name && (
              <span className="text-[10px] text-zinc-500">🤖 {task.agent_name}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
