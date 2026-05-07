'use client';

import { useState } from 'react';
import { X, Rocket, FolderKanban, Cpu, LayoutGrid, Zap, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';

interface DispatcherProps {
  projects: any[];
  agents: any[];
  templates: any[];
  onDispatch: (payload: any) => Promise<void>;
  onClose: () => void;
}

export function FleetDispatcher({ projects, agents, templates, onDispatch, onClose }: DispatcherProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    projectId: '',
    templateId: '',
    agentId: '',
    prompt: '',
    priority: 'medium'
  });

  const handleDispatch = async () => {
    setLoading(true);
    try {
      await onDispatch(config);
      onClose();
    } catch (e) {
      console.error('Dispatch failed', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-800 animate-slide-up">
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-800 bg-gradient-to-r from-indigo-600/20 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Fleet Dispatcher</h2>
                <p className="text-xs text-zinc-500">Assign an agent to a high-impact task</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Step 1: Context Selection */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                <FolderKanban className="w-4 h-4" /> Target Project
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {projects.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setConfig({...config, projectId: p.id.toString()})}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      config.projectId === p.id.toString() 
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm' 
                      : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{p.icon}</span>
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Task Template
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {templates.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setConfig({...config, templateId: t.id.toString()})}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      config.templateId === t.id.toString() 
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm' 
                      : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{t.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{t.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prompt Area */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Task Details
            </label>
            <textarea 
              value={config.prompt}
              onChange={(e) => setConfig({...config, prompt: e.target.value})}
              placeholder="Describe the goal... e.g. 'Fix the image flickering on mobile' or 'Implement Zod validation for the auth endpoint'"
              className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none h-32 text-sm"
            />
          </div>

          {/* Agent Selection */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Dispatch Agent
            </label>
            <div className="grid grid-cols-4 gap-3">
              {agents.map(a => (
                <button 
                  key={a.id}
                  onClick={() => setConfig({...config, agentId: a.id.toString()})}
                  className={`p-3 rounded-xl border transition-all text-center ${
                    config.agentId === a.id.toString() 
                    ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm' 
                    : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-lg mb-1">{a.type === 'codex' ? '💻' : '🧠'}</div>
                  <div className="text-[10px] font-medium truncate">{a.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Execute Button */}
          <div className="pt-4">
            <button 
              onClick={handleDispatch}
              disabled={loading || !config.projectId || !config.agentId || !config.prompt}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
              {loading ? 'Launching Agent...' : 'Dispatch to Fleet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
