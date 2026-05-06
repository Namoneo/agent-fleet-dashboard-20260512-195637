'use client';

export function AgentBoard({ agents }: { agents: any[] }) {
  const statusColors: Record<string, string> = {
    idle: 'bg-green-100 text-green-700 border-green-200',
    busy: 'bg-orange-100 text-orange-700 border-orange-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    away: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const typeIcons: Record<string, string> = {
    openclaw: '🧠',
    codex: '💻',
    telegram: '📱',
    custom: '⚙️',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">🤖 Agent Status Board</h2>
        <span className="text-sm text-gray-500">{agents?.filter(a => a.status === 'idle').length} available</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {agents?.map((agent) => (
          <div
            key={agent.id}
            className={`p-4 rounded-lg border ${statusColors[agent.status] || statusColors.idle}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{typeIcons[agent.type] || '🤖'}</span>
                <span className="font-medium">{agent.name}</span>
              </div>
              <span className="text-xs font-medium uppercase">{agent.status}</span>
            </div>

            {agent.skills && (
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.skills.split(',').map((skill: string) => (
                  <span
                    key={skill}
                    className="text-xs bg-white/50 px-2 py-1 rounded"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            )}

            <button className="w-full mt-3 text-sm font-medium bg-white/70 hover:bg-white py-2 rounded transition-colors">
              {agent.status === 'idle' ? 'Assign Task' : 'View Progress'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
