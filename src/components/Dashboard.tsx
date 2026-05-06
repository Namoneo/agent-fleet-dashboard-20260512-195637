'use client';

import { useState, useEffect } from 'react';
import { ProjectCard } from './ProjectCard';
import { AgentBoard } from './AgentBoard';
import { TaskList } from './TaskList';
import { ActivityFeed } from './ActivityFeed';
import { CreateTaskModal } from './CreateTaskModal';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchData();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading dashboard... 🔄</div>
      </div>
    );
  }

  const { projects, agents, tasks, activities } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏠 Project Command Center</h1>
          <p className="text-gray-500 mt-1">Manage all your projects and agents in one place</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> Create Task
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Projects" value={projects?.length || 0} icon="📊" color="blue" />
        <StatCard label="Total Tasks" value={tasks?.length || 0} icon="📋" color="purple" />
        <StatCard label="Available Agents" value={agents?.filter((a: any) => a.status === 'idle').length || 0} icon="🤖" color="green" />
        <StatCard label="Completed Today" value={tasks?.filter((t: any) => t.status === 'done').length || 0} icon="✅" color="orange" />
      </div>

      {/* Projects Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Projects</h2>
        <div className="grid grid-cols-3 gap-4">
          {projects?.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <AgentBoard agents={agents} />
          <TaskList tasks={tasks} />
        </div>

        {/* Right Column */}
        <div>
          <ActivityFeed activities={activities} />
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

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}
