export function MobileProjectCard({ project }: { project: any }) {
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    stuck: 'bg-red-500/20 text-red-400 border-red-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl">
          {project.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{project.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{project.description || 'No description'}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[project.status] || statusColors.active}`}>
              {project.status}
            </span>
            <span className="text-[10px] text-zinc-500">📋 {project.task_count} tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
