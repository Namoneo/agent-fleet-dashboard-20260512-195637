'use client';

import { useState, useEffect, useCallback } from 'react';
import { MobileProjectCard } from './MobileProjectCard';
import { MobileAgentCard } from './MobileAgentCard';
import { MobileTaskCard } from './MobileTaskCard';

export function MobileLayout({ data }: { data: any }) {
  const [activeTab, setActiveTab] = useState('home');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [pageData, setPageData] = useState(data);

  const { projects = [], agents = [], tasks = [] } = pageData || {};

  // Pull to refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Store start position for pull to refresh
    (window as any).touchStartY = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchStartY = (window as any).touchStartY || 0;
    if (touchEndY - touchStartY > 150 && window.scrollY < 10) {
      setIsRefreshing(true);
      fetch('/api/dashboard')
        .then(res => res.json())
        .then(json => {
          setPageData(json);
          setIsRefreshing(false);
        })
        .catch(() => setIsRefreshing(false));
    }
  }, []);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      className="min-h-screen bg-zinc-950 text-white pb-24"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
          <div className="bg-zinc-800/90 backdrop-blur-lg rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Refreshing...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm">
              🚀
            </div>
            <div>
              <h1 className="text-sm font-bold">Fleet</h1>
              <p className="text-[10px] text-zinc-500">{projects.length} projects • {agents.length} agents</p>
            </div>
          </div>
          <button 
            className="relative p-2 rounded-xl hover:bg-zinc-800 transition-colors active:scale-90"
            onClick={() => alert('🔔 3 new notifications')}
          >
            <span className="text-lg">🔔</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4">
        {activeTab === 'home' && (
          <HomeView 
            projects={projects} 
            agents={agents} 
            tasks={tasks} 
            onNavigate={switchTab}
          />
        )}
        {activeTab === 'projects' && (
          <ProjectsView projects={projects} onBack={() => switchTab('home')} />
        )}
        {activeTab === 'agents' && (
          <AgentsView agents={agents} onBack={() => switchTab('home')} />
        )}
        {activeTab === 'tasks' && (
          <TasksView tasks={tasks} onBack={() => switchTab('home')} />
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowCreateTask(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-2xl active:scale-90 transition-transform z-40"
      >
        +
      </button>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateTask(false);
          }}
        >
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-md border border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Create Task</h2>
            <input 
              type="text" 
              placeholder="Task title"
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <textarea 
              placeholder="Description (optional)"
              rows={3}
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold active:scale-95 transition-transform"
              onClick={() => {
                alert('Task created!');
                setShowCreateTask(false);
              }}
            >
              Create Task
            </button>
            <button 
              className="w-full bg-zinc-800 text-zinc-400 rounded-xl py-3 font-semibold mt-2 active:scale-95 transition-transform"
              onClick={() => setShowCreateTask(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          <NavButton 
            icon="🏠" 
            label="Home" 
            isActive={activeTab === 'home'} 
            onClick={() => switchTab('home')} 
          />
          <NavButton 
            icon="📁" 
            label="Projects" 
            isActive={activeTab === 'projects'} 
            onClick={() => switchTab('projects')} 
          />
          <NavButton 
            icon="🤖" 
            label="Agents" 
            isActive={activeTab === 'agents'} 
            onClick={() => switchTab('agents')} 
          />
          <NavButton 
            icon="✅" 
            label="Tasks" 
            isActive={activeTab === 'tasks'} 
            onClick={() => switchTab('tasks')} 
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-90 ${
        isActive
          ? 'text-indigo-400 bg-indigo-500/10'
          : 'text-zinc-500'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function HomeView({ projects, agents, tasks, onNavigate }: { projects: any[], agents: any[], tasks: any[], onNavigate: (tab: string) => void }) {
  const activeProjects = projects.filter((p: any) => p.status === 'active');
  const activeTasks = tasks.filter((t: any) => t.status !== 'done');
  const idleAgents = agents.filter((a: any) => a.status === 'idle');

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => onNavigate('projects')} className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800/50 active:scale-95 transition-transform">
          <div className="text-2xl font-bold text-indigo-400">{activeProjects.length}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Projects</div>
        </button>
        <button onClick={() => onNavigate('tasks')} className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800/50 active:scale-95 transition-transform">
          <div className="text-2xl font-bold text-emerald-400">{activeTasks.length}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Active</div>
        </button>
        <button onClick={() => onNavigate('agents')} className="bg-zinc-900 rounded-2xl p-4 text-center border border-zinc-800/50 active:scale-95 transition-transform">
          <div className="text-2xl font-bold text-amber-400">{idleAgents.length}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Agents</div>
        </button>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Recent Projects</h2>
          <button onClick={() => onNavigate('projects')} className="text-xs text-indigo-400 font-medium active:opacity-70">
            View all →
          </button>
        </div>
        <div className="space-y-3">
          {projects.slice(0, 5).map((project: any) => (
            <MobileProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* Active Agents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Active Agents</h2>
          <button onClick={() => onNavigate('agents')} className="text-xs text-indigo-400 font-medium active:opacity-70">
            View all →
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {agents.map((agent: any) => (
            <MobileAgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Active Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">Active Tasks</h2>
          <button onClick={() => onNavigate('tasks')} className="text-xs text-indigo-400 font-medium active:opacity-70">
            View all →
          </button>
        </div>
        <div className="space-y-3">
          {activeTasks.slice(0, 3).map((task: any) => (
            <MobileTaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsView({ projects, onBack }: { projects: any[], onBack: () => void }) {
  return (
    <div className="space-y-3">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 text-sm mb-4 active:opacity-70"
      >
        ← Back
      </button>
      <h2 className="text-lg font-bold mb-4">All Projects ({projects.length})</h2>
      {projects.map((project: any) => (
        <MobileProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function AgentsView({ agents, onBack }: { agents: any[], onBack: () => void }) {
  return (
    <div className="space-y-3">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 text-sm mb-4 active:opacity-70"
      >
        ← Back
      </button>
      <h2 className="text-lg font-bold mb-4">Agent Fleet ({agents.length})</h2>
      {agents.map((agent: any) => (
        <MobileAgentCard key={agent.id} agent={agent} fullWidth />
      ))}
    </div>
  );
}

function TasksView({ tasks, onBack }: { tasks: any[], onBack: () => void }) {
  const activeTasks = tasks.filter((t: any) => t.status !== 'done');
  
  return (
    <div className="space-y-3">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 text-sm mb-4 active:opacity-70"
      >
        ← Back
      </button>
      <h2 className="text-lg font-bold mb-4">Tasks ({activeTasks.length} active)</h2>
      {activeTasks.map((task: any) => (
        <MobileTaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
