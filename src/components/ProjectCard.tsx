export function ProjectCard({ project }: { project: any }) {
  const statusColors: Record<string, string> = {
    active: '🟢',
    paused: '🟡',
    stuck: '🔴',
    completed: '✅',
  };

  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 border-green-200 hover:border-green-300',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-300',
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-300',
    red: 'bg-red-50 border-red-200 hover:border-red-300',
    yellow: 'bg-yellow-50 border-yellow-200 hover:border-yellow-300',
  };

  return (
    <div className={`p-5 rounded-xl border ${colorClasses[project.color] || colorClasses.blue} transition-all hover:shadow-md cursor-pointer`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{project.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{project.name}</h3>
            <span className="text-xs text-gray-500">{statusColors[project.status] || '🟢'} {project.status}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>📋 {project.task_count} tasks</span>
        <span>🤖 {project.agent_count} agents</span>
      </div>
    </div>
  );
}
