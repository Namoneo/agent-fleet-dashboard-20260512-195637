'use client';

import { useState, useEffect } from 'react';
import { ProjectCard } from './ProjectCard';
import { AgentBoard } from './AgentBoard';
import { TaskList } from './TaskList';
import { ActivityFeed } from './ActivityFeed';
import { CreateTaskModal } from './CreateTaskModal';
import { Plus, LayoutDashboard, FolderKanban, Bot, CheckSquare2, Bell } from 'lucide-react';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const { projects, agents, tasks, activities } = data || {};
  const activeProjects = projects?.filter((p: any) => p.status === 'active') || [];
  const activeTasks = tasks?.filter((t: any) => t.status !== 'done') || [];
  const completedTasks = tasks?.filter((t: any) => t.status === 'done') || [];
  const idleAgents = agents?.filter((a: any) => a.status === 'idle') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Command Center</h1>
                <p className="text-xs text-gray-500 -mt-0.5">{projects?.length || 0} projects • {agents?.length || 0} agents</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Active Projects"
            value={activeProjects.length}
            icon={FolderKanban}
            color="from-blue-500 to-cyan-500"
            trend="+2 this week"
          />
          <StatCard
            label="In Progress"
            value={activeTasks.length}
            icon={CheckSquare2}
            color="from-emerald-500 to-teal-500"
            trend={`${completedTasks.length} done`}
          />
          <StatCard
            label="Available Agents"
            value={idleAgents.length}
            icon={Bot}
            color="from-violet-500 to-purple-500"
            trend="Ready to assign"
          />
          <StatCard
            label="Completion Rate"
            value={tasks?.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0}
            icon={CheckSquare2}
            color="from-orange-500 to-amber-500"
            suffix="%"
            trend="This month"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - 8 cols */}
          <div className="col-span-8 space-y-6">
            {/* Projects Section */}
            <section className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {projects?.length || 0}
                  </span>
                </div>
                <div className="flex gap-1 bg-gray-100/80 p-1 rounded-lg">
                  {['overview', 'grid', 'list'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === tab
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {projects?.slice(0, 9).map((project: any, i: number) => (
                  <ProjectCard key={project.id} project={project} index={i} />
                ))}
              </div>

              {projects?.length > 9 && (
                <button className="w-full mt-4 py-3 text-sm text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors font-medium">
                  View all {projects.length} projects →
                </button>
              )}
            </section>

            {/* Tasks & Agent Board */}
            <div className="grid grid-cols-2 gap-6">
              <TaskList tasks={tasks} />
              <AgentBoard agents={agents} />
            </div>
          </div>

          {/* Right Column - 4 cols */}
          <div className="col-span-4">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
          agents={agents}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  suffix = '',
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  trend: string;
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <div>
        <span className="text-3xl font-bold text-gray-900 tracking-tight">
          {value}
          {suffix}
        </span>
        <p className="text-sm text-gray-500 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}
