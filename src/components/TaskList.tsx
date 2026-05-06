'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, Circle, ArrowUpRight } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  project_name?: string;
  project_icon?: string;
  agent_name?: string;
}

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const [filter, setFilter] = useState('active');

  const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
    urgent: { color: 'text-red-600', bg: 'bg-red-50', label: 'Urgent' },
    high: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'High' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' },
    low: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Low' },
  };

  const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    backlog: { icon: Circle, color: 'text-gray-400', bg: 'bg-gray-50' },
    in_progress: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    review: { icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
    done: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    blocked: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  };

  const filteredTasks = tasks?.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'active') return task.status !== 'done';
    return task.status === filter;
  }) || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {filteredTasks.length}
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-3">
          {[
            { key: 'active', label: 'Active' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'done', label: 'Done' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === tab.key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {filteredTasks.slice(0, 8).map((task) => {
          const status = statusConfig[task.status] || statusConfig.backlog;
          const priority = priorityConfig[task.priority] || priorityConfig.medium;
          const StatusIcon = status.icon;

          return (
            <div
              key={task.id}
              className="group p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className={`mt-0.5 w-5 h-5 rounded-full ${status.bg} flex items-center justify-center flex-shrink-0`}>
                  <StatusIcon className={`w-3 h-3 ${status.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.color} flex-shrink-0`}>
                      {priority.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {task.project_name && (
                      <span className="flex items-center gap-1">
                        <span>{task.project_icon || '📁'}</span>
                        {task.project_name}
                      </span>
                    )}
                    {task.agent_name && (
                      <span className="flex items-center gap-1">
                        🤖 {task.agent_name}
                      </span>
                    )}
                  </div>
                </div>

                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tasks found</p>
        </div>
      )}
    </div>
  );
}
