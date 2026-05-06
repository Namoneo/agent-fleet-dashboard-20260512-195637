'use client';

import { useState } from 'react';

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
};

const statusLabels: Record<string, string> = {
  backlog: '📦 Backlog',
  in_progress: '🔄 In Progress',
  review: '👀 Review',
  done: '✅ Done',
  blocked: '🚫 Blocked',
};

export function TaskList({ tasks }: { tasks: any[] }) {
  const [filter, setFilter] = useState('all');

  const filteredTasks = tasks?.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'active') return task.status !== 'done';
    return task.status === filter;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">📋 Priority Tasks</h2>
        <div className="flex gap-2">
          {['all', 'active', 'in_progress', 'done'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filter === f
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks?.slice(0, 10).map((task) => (
          <div
            key={task.id}
            className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded border ${priorityColors[task.priority] || priorityColors.medium}`}>
                {task.priority}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{task.project_icon} {task.project_name}</span>
              <span>{statusLabels[task.status] || task.status}</span>
              {task.agent_name && <span>🤖 {task.agent_name}</span>}
              </div>
          </div>
        ))}

        {filteredTasks?.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
}
