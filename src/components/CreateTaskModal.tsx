'use client';

import { useState } from 'react';
import { X, Plus, FolderKanban, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CreateTaskModalProps {
  projects: any[];
  agents: any[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTaskModal({ projects, agents, onClose, onCreated }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId ? parseInt(projectId) : null,
          title,
          description,
          priority,
          assigned_agent_id: assignedAgentId ? parseInt(assignedAgentId) : null,
        }),
      });
      onCreated();
      onClose();
    } catch (e) {
      console.error('Failed to create task', e);
    } finally {
      setSubmitting(false);
    }
  }

  const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
    low: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Low' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium' },
    high: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'High' },
    urgent: { color: 'text-red-600', bg: 'bg-red-50', label: 'Urgent' },
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
              <p className="text-sm text-gray-500 mt-0.5">Step {step} of 2</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex">
          <div className={`h-1 flex-1 transition-all ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`h-1 flex-1 transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {step === 1 && (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Fix Lidl scraper images"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what needs to be done..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none"
                />
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Project</label>
                <div className="grid grid-cols-3 gap-2">
                  {projects?.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProjectId(p.id.toString())}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        projectId === p.id.toString()
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{p.icon}</span>
                      <p className="text-xs font-medium text-gray-700 mt-1 truncate">{p.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPriority(key)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        priority === key
                          ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                          : `border-gray-200 hover:border-gray-300 ${config.bg}`
                      }`}
                    >
                      <span className={`text-xs font-semibold ${priority === key ? 'text-white' : config.color}`}>
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign Agent */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Assign to Agent</label>
                <div className="space-y-2">
                  {agents?.filter((a) => a.status === 'idle').map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAssignedAgentId(a.id.toString())}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        assignedAgentId === a.id.toString()
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm">
                        {a.type === 'openclaw' ? '🧠' : a.type === 'codex' ? '💻' : '📱'}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.skills?.split(',').slice(0, 2).join(', ')}</p>
                      </div>
                      {assignedAgentId === a.id.toString() && (
                        <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 shadow-lg shadow-blue-500/25"
              >
                {submitting ? 'Creating...' : 'Create Task'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
