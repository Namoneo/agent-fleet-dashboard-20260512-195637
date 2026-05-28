import { formatDistanceToNow } from 'date-fns';
import { Activity, GitCommit, MessageSquare, CheckCircle2, AlertTriangle, Rocket, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Activity as ActivityItem } from '@/types';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const actionConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
    completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    started: { icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50' },
    blocked: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    comment: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
    notification: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' },
    assigned: { icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
    commit: { icon: GitCommit, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-20">
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
        </div>
      </div>

      <div className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {activities?.map((activity, i) => {
          const config = actionConfig[activity.action] || actionConfig.notification;
          const Icon = config.icon;

          return (
            <div
              key={activity.id}
              className="group p-3 rounded-xl hover:bg-gray-50/50 transition-colors"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className={`mt-0.5 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    <span className="font-semibold">{activity.agent_name || 'System'}</span>{' '}
                    <span className="text-gray-500">{activity.action}</span>
                  </p>

                  <p className="text-sm text-gray-600 mt-0.5">{activity.message}</p>

                  {activity.project_name && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      📁 {activity.project_name}
                      {activity.task_title && ` • ${activity.task_title}`}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1.5">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {activities?.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
