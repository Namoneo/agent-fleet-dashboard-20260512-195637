'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, Bot, CheckSquare2, Bell, Menu, X, Plus } from 'lucide-react';
import { MobileProjectCard } from './MobileProjectCard';
import { MobileAgentCard } from './MobileAgentCard';
import { MobileTaskCard } from './MobileTaskCard';

export function MobileLayout({ data }: { data: any }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { projects, agents, tasks, activities } = data || {};

  // Pull to refresh
  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchEndY - touchStartY > 150 && window.scrollY < 10) {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1500);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const tabs = [
    { id: 'home', icon: LayoutDashboard, label: 'Home' },
    { id: 'projects', icon: FolderKanban, label: 'Projects' },
    { id: 'agents', icon: Bot, label: 'Agents' },
    { id: 'tasks', icon: CheckSquare2, label: 'Tasks' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Pull to Refresh Indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
          <div className="bg-zinc-800/90 backdrop-blur-lg rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Refreshing...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Fleet</h1>
              <p className="text-[10px] text-zinc-500">{projects?.length} projects • {agents?.length} agents</p>
            </div>
          </div>
          <button className="relative p-2">
            <Bell className="w-5 h-5 text-zinc-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-4">
        {activeTab === 'home' && <HomeView projects={projects} agents={agents} tasks={tasks} />}
        {activeTab === 'projects' && <ProjectsView projects={projects} />}
        {activeTab === 'agents' && <AgentsView agents={agents} />}
        {activeTab === 'tasks' && <TasksView tasks={tasks} />}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowCreateTask(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 px-2 py-2 z-50">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                  activeTab === tab.id
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-zinc-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function HomeView({ projects, agents, tasks }: { projects: any[], agents: any[], tasks: any[] }) {
  const activeProjects = projects?.filter((p: any) => p.status === 'active') || [];
  const activeTasks = tasks?.filter((t: any) => t.status !== 'done') || [];
  const idleAgents = agents?.filter((a: any) => a.status === 'idle') || [];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-indigo-400">{activeProjects.length}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Active Projects</div>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{activeTasks.length}</div>
          <div className="text-[10px] text-zinc-500 mt-1">In Progress</div>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{idleAgents.length}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Ready Agents</div>
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Recent Projects</h2>
          <button className="text-xs text-indigo-400">View all</button>
        </div>
        <div className="space-y-3">
          {projects?.slice(0, 5).map((project: any) => (
            <MobileProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* Active Agents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Active Agents</h2>
          <button className="text-xs text-indigo-400">View all</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {agents?.map((agent: any) => (
            <MobileAgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsView({ projects }: { projects: any[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold mb-4">All Projects ({projects?.length})</h2>
      {projects?.map((project: any) => (
        <MobileProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function AgentsView({ agents }: { agents: any[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold mb-4">Agent Fleet ({agents?.length})</h2>
      {agents?.map((agent: any) => (
        <MobileAgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

function TasksView({ tasks }: { tasks: any[] }) {
  const activeTasks = tasks?.filter((t: any) => t.status !== 'done') || [];
  
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold mb-4">Tasks ({activeTasks.length} active)</h2>
      {activeTasks.map((task: any) => (
        <MobileTaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
