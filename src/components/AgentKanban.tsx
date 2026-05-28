'use client';

import { useState, useMemo } from 'react';
import { Cpu, GitBranch, FolderKanban, MoreHorizontal, Filter, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { Agent, Project } from '@/types';

interface AgentKanbanProps {
  agents: Agent[];
  projects?: Project[];
  onTaskCreated?: () => void;
}

type GroupBy = 'status' | 'repository' | 'type';

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  openclaw: { icon: '🧠', color: 'from-blue-500 to-indigo-500', label: 'OpenClaw' },
  codex: { icon: '💻', color: 'from-purple-500 to-violet-500', label: 'Codex' },
  telegram: { icon: '📱', color: 'from-sky-500 to-cyan-500', label: 'Telegram' },
  custom: { icon: '⚙️', color: 'from-gray-500 to-slate-500', label: 'Custom' },
};

export function AgentKanban({ agents, projects = [], onTaskCreated }: AgentKanbanProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('status');

  // Define columns based on groupBy
  const columns = useMemo(() => {
    if (groupBy === 'status') {
      return [
        { id: 'idle', title: 'Available', color: 'bg-emerald-500', bgColor: 'bg-emerald-50/50', borderColor: 'border-emerald-200', icon: Clock },
        { id: 'busy', title: 'In Progress', color: 'bg-amber-500', bgColor: 'bg-amber-50/50', borderColor: 'border-amber-200', icon: Loader2 },
        { id: 'completed', title: 'Completed', color: 'bg-blue-500', bgColor: 'bg-blue-50/50', borderColor: 'border-blue-200', icon: CheckCircle2 },
        { id: 'error', title: 'Error', color: 'bg-red-500', bgColor: 'bg-red-50/50', borderColor: 'border-red-200', icon: XCircle },
      ];
    } else if (groupBy === 'type') {
      const types = [...new Set(agents.map(a => a.type || 'custom'))];
      return types.map(type => ({
        id: type,
        title: typeConfig[type]?.label || type.charAt(0).toUpperCase() + type.slice(1),
        color: typeConfig[type]?.color.split(' ')[0].replace('from-', 'bg-') || 'bg-gray-500',
        bgColor: 'bg-gray-50/50',
        borderColor: 'border-gray-200',
        icon: Cpu,
      }));
    } else {
      // repository grouping
      const repos = [...new Set(agents.map(a => a.current_project_name || 'Unassigned'))];
      return repos.map(repo => ({
        id: repo,
        title: repo,
        color: 'bg-indigo-500',
        bgColor: 'bg-indigo-50/50',
        borderColor: 'border-indigo-200',
        icon: FolderKanban,
      }));
    }
  }, [agents, groupBy]);

  // Group agents
  const groupedAgents = useMemo(() => {
    const groups: Record<string, Agent[]> = {};
    
    columns.forEach(col => {
      groups[col.id] = [];
    });

    agents.forEach(agent => {
      let groupId: string;
      
      if (groupBy === 'status') {
        if (agent.run_exit_code !== undefined && agent.run_exit_code !== null) {
          groupId = agent.run_exit_code === 0 ? 'completed' : 'error';
        } else if (agent.status === 'busy') {
          groupId = 'busy';
        } else {
          groupId = 'idle';
        }
      } else if (groupBy === 'type') {
        groupId = agent.type || 'custom';
      } else {
        groupId = agent.current_project_name || 'Unassigned';
      }

      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(agent);
    });

    return groups;
  }, [agents, columns, groupBy]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Agent Fleet</h2>
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {agents?.length || 0}
            </span>
          </div>
          
          {/* Group By Toggle */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-1 bg-gray-100/80 p-1 rounded-lg">
              {(['status', 'type', 'repository'] as GroupBy[]).map((gb) => (
                <button
                  key={gb}
                  onClick={() => setGroupBy(gb)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    groupBy === gb
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {gb.charAt(0).toUpperCase() + gb.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {columns.map(column => {
            const columnAgents = groupedAgents[column.id] || [];
            const Icon = column.icon;
            
            return (
              <div 
                key={column.id}
                className={`w-72 shrink-0 rounded-xl border ${column.borderColor} ${column.bgColor}`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${column.color}`} />
                      <span className="text-sm font-semibold text-gray-700">{column.title}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-white/50 px-2 py-0.5 rounded-full">
                      {columnAgents.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2">
                  {columnAgents.map(agent => (
                    <AgentCard 
                      key={agent.id} 
                      agent={agent} 
                      groupBy={groupBy}
                    />
                  ))}
                  {columnAgents.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-400">
                      No agents
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, groupBy }: { agent: Agent; groupBy: GroupBy }) {
  const type = typeConfig[agent.type] || typeConfig.custom;
  
  // Determine status color
  let statusColor = 'bg-gray-400';
  let statusLabel: string = agent.status;
  
  if (agent.run_exit_code !== undefined && agent.run_exit_code !== null) {
    if (agent.run_exit_code === 0) {
      statusColor = 'bg-emerald-500';
      statusLabel = 'completed';
    } else {
      statusColor = 'bg-red-500';
      statusLabel = 'error';
    }
  } else if (agent.status === 'busy') {
    statusColor = 'bg-amber-500';
    statusLabel = 'busy';
  } else if (agent.status === 'idle') {
    statusColor = 'bg-emerald-500';
    statusLabel = 'available';
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      {/* Card Header */}
      <div className="flex items-start gap-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center shrink-0`}>
          <span className="text-sm">{type.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-900 text-sm truncate">{agent.name}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
          </div>
          <span className="text-xs text-gray-500 capitalize">{statusLabel}</span>
        </div>
      </div>

      {/* Current Task */}
      {agent.current_task_title && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs">
            <Loader2 className={`w-3 h-3 ${agent.status === 'busy' ? 'animate-spin text-amber-500' : 'text-gray-400'}`} />
            <span className="text-gray-600 truncate">{agent.current_task_title}</span>
          </div>
        </div>
      )}

      {/* Repo/Branch Info */}
      {agent.current_project_name && groupBy !== 'repository' && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
          <GitBranch className="w-3 h-3" />
          <span className="truncate">{agent.current_project_name}</span>
        </div>
      )}

      {/* Skills */}
      {agent.skills && (
        <div className="mt-2 flex flex-wrap gap-1">
          {agent.skills.split(',').slice(0, 3).map((skill) => (
            <span 
              key={skill} 
              className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
            >
              {skill.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
