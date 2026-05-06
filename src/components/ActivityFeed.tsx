export function ActivityFeed({ activities }: { activities: any[] }) {
  const actionIcons: Record<string, string> = {
    completed: '✅',
    started: '🚀',
    blocked: '🚫',
    comment: '💬',
    notification: '🔔',
    assigned: '👤',
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">📈 Activity Feed</h2>
        <span className="text-sm text-gray-500">Last 24h</span>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {activities?.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
              {actionIcons[activity.action] || '📋'}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">
                <span className="font-medium">{activity.agent_name || 'System'}</span>
                {' '}
                <span className="text-gray-500">{activity.action}</span>
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{activity.message}</p>
              {activity.project_name && (
                <span className="text-xs text-gray-400 mt-1">
                  📁 {activity.project_name}
                  {activity.task_title && ` • ${activity.task_title}`}
                </span>
              )}
              <p className="text-xs text-gray-400 mt-1">{formatTime(activity.created_at)}</p>
            </div>
          </div>
        ))}

        {activities?.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
}
