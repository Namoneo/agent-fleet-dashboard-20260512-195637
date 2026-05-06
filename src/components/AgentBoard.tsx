'use client';

import { useState } from 'react';
import { Cpu, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { CreateTaskModal } from './CreateTaskModal';

interface Agent {
  id: number;
  name: string;
  type: string;
  status: 'idle' | 'busy' | 'error' | 'away';
  skills?: string;
}

interface AgentBoardProps {
  agents: Agent[];
  projects?: any[];
  onTaskCreated?: () => void;
}

export function AgentBoard({ agents, projects = [], onTaskCreated }: AgentBoardProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const statusConfig: Record<string, { 
    bg: string; 
    text: string; 
    dot: string;
    ring: string;
    label: string;
  }> = {
    idle: { 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-700', 
      dot: 'bg-emerald-500',
      ring: 'ring-emerald-500/20',
      label: 'Available'
    },
    busy: { 
      bg: 'bg-amber-50', 
      text: 'text-amber-700', 
      dot: 'bg-amber-500',
      ring: 'ring-amber-500/20',
      label: 'Busy'
    },
    error: { 
      bg: 'bg-red-50', 
      text: 'text-red-700', 
      dot: 'bg-red-500',
      ring: 'ring-red-500/20',
      label: 'Error'
    },
    away: { 
      bg: 'bg-gray-50', 
      text: 'text-gray-600', 
      dot: 'bg-gray-400',
      ring: 'ring-gray-400/20',
      label: 'Away'
    },
  };

  const typeConfig: Record<string, { icon: string; color: string }> = {
    openclaw: { icon: '🧠', color: 'from-blue-500 to-indigo-500' },
    codex: { icon: '💻', color: 'from-purple-500 to-violet-500' },
    telegram: { icon: '📱', color: 'from-sky-500 to-cyan-500' },
    custom: { icon: '⚙️', color: 'from-gray-500 to-slate-500' },
  };

  const handleAssign = (agent: Agent) => {
    if (agent.status !== 'idle') {
      // For busy agents, show their current work
      return;
    }
    setSelectedAgent(agent);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Agents</h2>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {agents?.length || 0}
              </span>
            </div>
            <span className="text-sm text-emerald-600 font-medium">
              {agents?.filter(a => a.status === 'idle').length} available
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {agents?.map((agent, i) => {
            const status = statusConfig[agent.status] || statusConfig.idle;
            const type = typeConfig[agent.type] || typeConfig.custom;

            return (
              <div 
                key={agent.id} 
                className="group p-4 hover:bg-gray-50/50 transition-colors"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg text-lg`}>
                      {type.icon}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${status.dot} ring-2 ring-white`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{agent.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    {agent.skills && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {agent.skills.split(',').slice(0, 3).map((skill) => (
                          <span key={skill} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {skill.trim()}
                          </span>
                        ))}
                        {agent.skills.split(',').length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{agent.skills.split(',').length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <button 
                    onClick={() => handleAssign(agent)}
                    className={`opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg ${
                      agent.status === 'idle' 
                        ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {agent.status === 'idle' ? (
                      <>
                        Assign <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" /> Ping
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Task Modal with pre-selected agent */}
      {selectedAgent && (
        <CreateTaskModal
          projects={projects}
          agents={agents}
          preSelectedAgent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onCreated={() => {
            setSelectedAgent(null);
            onTaskCreated?.();
          }}
        />
      )}
    </>
  );
}
