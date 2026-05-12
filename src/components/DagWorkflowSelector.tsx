'use client';

import { useState, useEffect } from 'react';
import { GitBranch, ChevronDown, Workflow, Loader2 } from 'lucide-react';

interface DagWorkflow {
  id: number;
  name: string;
  description: string;
  dag: {
    title: string;
    models: Record<string, string>;
    tasks: Array<{
      id: string;
      depends_on: string[];
      complexity: 'HIGH' | 'MED' | 'LOW';
      subtask_prompt: string;
    }>;
  };
}

interface DagWorkflowSelectorProps {
  selectedWorkflowId: string;
  onSelect: (workflowId: string) => void;
}

export function DagWorkflowSelector({ selectedWorkflowId, onSelect }: DagWorkflowSelectorProps) {
  const [workflows, setWorkflows] = useState<DagWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    try {
      const res = await fetch('/api/dag');
      const json = await res.json();
      setWorkflows(json);
    } catch (e) {
      console.error('Failed to fetch DAG workflows', e);
    } finally {
      setLoading(false);
    }
  }

  const selectedWorkflow = workflows.find(w => w.id.toString() === selectedWorkflowId);

  if (loading) {
    return (
      <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
        <span className="text-sm text-zinc-500">Loading workflows...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
        <Workflow className="w-4 h-4" /> DAG Workflow
      </label>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
            selectedWorkflowId 
              ? 'border-indigo-500 bg-indigo-500/10 text-white' 
              : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-sm font-medium">
                {selectedWorkflow?.name || 'Select a workflow'}
              </p>
              {selectedWorkflow && (
                <p className="text-xs text-zinc-500">{selectedWorkflow.description}</p>
              )}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden z-50 shadow-xl">
            {workflows.map(workflow => (
              <button
                key={workflow.id}
                onClick={() => {
                  onSelect(workflow.id.toString());
                  setIsOpen(false);
                }}
                className={`w-full p-3 text-left flex items-start gap-3 transition-colors hover:bg-zinc-800 ${
                  selectedWorkflowId === workflow.id.toString() ? 'bg-indigo-500/10' : ''
                }`}
              >
                <GitBranch className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{workflow.name}</p>
                  <p className="text-xs text-zinc-500">{workflow.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                      {workflow.dag.tasks.length} tasks
                    </span>
                    <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                      {workflow.dag.tasks.filter(t => t.complexity === 'HIGH').length} high complexity
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DAG Visualization Preview */}
      {selectedWorkflow && (
        <div className="mt-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 mb-3">Workflow Preview</p>
          <div className="flex flex-wrap gap-2">
            {selectedWorkflow.dag.tasks.map((task, idx) => (
              <div key={task.id} className="flex items-center gap-2">
                <div 
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    task.complexity === 'HIGH' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : task.complexity === 'MED'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {task.id}
                </div>
                {idx < selectedWorkflow.dag.tasks.length - 1 && (
                  <div className="w-4 h-px bg-zinc-700" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500/50" />
              High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500/50" />
              Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
              Low
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
