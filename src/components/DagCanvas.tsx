'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Terminal, GitBranch, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';

interface DagTask {
  id: string;
  depends_on: string[];
  complexity: 'HIGH' | 'MED' | 'LOW';
  subtask_prompt: string;
}

interface DagData {
  title: string;
  models: Record<string, string>;
  tasks: DagTask[];
}

interface CanvasTask {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'FINISHED' | 'ERROR';
  output: string;
  started_at: string | null;
  completed_at: string | null;
}

interface CanvasData {
  workflow_title: string;
  tasks: CanvasTask[];
  overall_status: 'pending' | 'running' | 'completed' | 'error';
}

interface DagExecution {
  id: number;
  workflow_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  canvas_data: CanvasData;
  workflow_name: string;
  dag: DagData;
}

interface DagCanvasProps {
  executionId: number;
  onClose: () => void;
}

export function DagCanvas({ executionId, onClose }: DagCanvasProps) {
  const [execution, setExecution] = useState<DagExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial execution data
  useEffect(() => {
    fetchExecution();
  }, [executionId]);

  // Setup SSE connection
  useEffect(() => {
    if (!executionId) return;

    const connectSSE = () => {
      const es = new EventSource(`/api/dag-executions/stream?id=${executionId}`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        if (event.data.startsWith(':heartbeat')) return;
        
        try {
          const data = JSON.parse(event.data);
          setExecution(prev => prev ? { ...prev, ...data } : null);
        } catch (e) {
          console.error('Failed to parse SSE data', e);
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        // Reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [executionId]);

  // Poll for updates as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchExecution();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [executionId, isConnected]);

  async function fetchExecution() {
    try {
      const res = await fetch(`/api/dag-executions/${executionId}`);
      const data = await res.json();
      setExecution(data);
    } catch (e) {
      console.error('Failed to fetch execution', e);
    } finally {
      setLoading(false);
    }
  }

  async function startExecution() {
    try {
      await fetch(`/api/dag-executions/${executionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'running' }),
      });
      fetchExecution();
    } catch (e) {
      console.error('Failed to start execution', e);
    }
  }

  async function resetExecution() {
    try {
      await fetch(`/api/dag-executions/${executionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'pending',
          canvas_data: {
            ...execution?.canvas_data,
            tasks: execution?.canvas_data.tasks.map(t => ({
              ...t,
              status: 'PENDING',
              output: '',
              started_at: null,
              completed_at: null,
            })),
            overall_status: 'pending'
          }
        }),
      });
      fetchExecution();
    } catch (e) {
      console.error('Failed to reset execution', e);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-zinc-400">Loading execution...</p>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-zinc-900 rounded-2xl p-8 max-w-md">
          <p className="text-red-400">Execution not found</p>
          <button onClick={onClose} className="mt-4 text-zinc-400 hover:text-white">Close</button>
        </div>
      </div>
    );
  }

  const { canvas_data, dag, workflow_name, status } = execution;
  const isRunning = status === 'running';
  const isCompleted = status === 'completed' || status === 'error';

  // Calculate positions for DAG visualization
  const taskPositions = calculateTaskPositions(dag.tasks);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden border border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-indigo-600/10 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">{workflow_name}</h2>
              <p className="text-xs text-zinc-500">{dag.title} • Execution #{executionId}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
              isConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isConnected ? 'Live' : 'Polling'}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isRunning && !isCompleted && (
              <button
                onClick={startExecution}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            )}
            {isRunning && (
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-amber-600/50 text-white rounded-lg font-medium cursor-not-allowed"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Running
              </button>
            )}
            {isCompleted && (
              <button
                onClick={resetExecution}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* DAG Visualization */}
          <div className="flex-1 bg-zinc-950/50 overflow-auto p-8">
            <div className="relative min-h-[500px]" style={{ width: Math.max(...taskPositions.map(p => p.x)) + 200 }}>
              {/* Connection Lines */}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                {dag.tasks.map(task => {
                  const fromPos = taskPositions.find(p => p.id === task.id);
                  if (!fromPos) return null;
                  
                  return task.depends_on.map(depId => {
                    const toPos = taskPositions.find(p => p.id === depId);
                    if (!toPos) return null;
                    
                    return (
                      <line
                        key={`${depId}-${task.id}`}
                        x1={toPos.x + 80}
                        y1={toPos.y + 40}
                        x2={fromPos.x}
                        y2={fromPos.y + 40}
                        stroke="#3f3f46"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    );
                  });
                })}
              </svg>

              {/* Task Nodes */}
              {dag.tasks.map((task, idx) => {
                const canvasTask = canvas_data.tasks.find(t => t.id === task.id);
                const pos = taskPositions[idx];
                const isSelected = selectedTask === task.id;
                
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task.id)}
                    className={`absolute w-40 p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                    }`}
                    style={{ left: pos.x, top: pos.y }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {canvasTask?.status === 'RUNNING' && <Loader2 className="w-4 h-4 animate-spin text-amber-400" />}
                      {canvasTask?.status === 'FINISHED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {canvasTask?.status === 'ERROR' && <AlertCircle className="w-4 h-4 text-red-400" />}
                      {canvasTask?.status === 'PENDING' && <Clock className="w-4 h-4 text-zinc-500" />}
                      <span className="text-xs font-mono text-zinc-400">{task.id}</span>
                    </div>
                    <div className={`text-xs font-medium ${
                      task.complexity === 'HIGH' ? 'text-red-400' :
                      task.complexity === 'MED' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {task.complexity} Complexity
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 truncate">
                      {canvasTask?.status || 'PENDING'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task Details Panel */}
          <div className="w-96 border-l border-zinc-800 bg-zinc-900 flex flex-col">
            {selectedTask ? (
              <>
                <div className="p-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-4 h-4 text-zinc-400" />
                    <h3 className="font-mono text-sm text-zinc-300">{selectedTask}</h3>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {dag.tasks.find(t => t.id === selectedTask)?.subtask_prompt.substring(0, 100)}...
                  </p>
                </div>
                
                <div className="flex-1 overflow-auto p-4">
                  <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap">
                    {(() => {
                      const task = canvas_data.tasks.find(t => t.id === selectedTask);
                      return task?.output || 'No output yet...';
                    })()}
                  </pre>
                </div>

                <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500">
                  {(() => {
                    const task = canvas_data.tasks.find(t => t.id === selectedTask);
                    return (
                      <>
                        <div>Status: {task?.status || 'PENDING'}</div>
                        {task?.started_at && <div>Started: {new Date(task.started_at).toLocaleTimeString()}</div>}
                        {task?.completed_at && <div>Completed: {new Date(task.completed_at).toLocaleTimeString()}</div>}
                      </>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <p className="text-sm">Select a task to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900 shrink-0">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Progress</span>
            <span>
              {canvas_data.tasks.filter(t => t.status === 'FINISHED').length} / {canvas_data.tasks.length} tasks
            </span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ 
                width: `${(canvas_data.tasks.filter(t => t.status === 'FINISHED').length / canvas_data.tasks.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate node positions in a DAG layout
function calculateTaskPositions(tasks: DagTask[]): Array<{ id: string; x: number; y: number }> {
  const positions: Array<{ id: string; x: number; y: number }> = [];
  const levels: Record<string, number> = {};
  
  // Calculate levels (depth) for each task
  const calculateLevel = (taskId: string, visited: Set<string> = new Set()): number => {
    if (levels[taskId] !== undefined) return levels[taskId];
    if (visited.has(taskId)) return 0; // Circular dependency guard
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.depends_on.length === 0) {
      levels[taskId] = 0;
      return 0;
    }
    
    visited.add(taskId);
    const maxDepLevel = Math.max(...task.depends_on.map(depId => calculateLevel(depId, visited)));
    levels[taskId] = maxDepLevel + 1;
    return levels[taskId];
  };
  
  tasks.forEach(task => calculateLevel(task.id));
  
  // Group tasks by level
  const tasksByLevel: Record<number, string[]> = {};
  Object.entries(levels).forEach(([taskId, level]) => {
    if (!tasksByLevel[level]) tasksByLevel[level] = [];
    tasksByLevel[level].push(taskId);
  });
  
  // Assign positions
  const levelWidth = 220;
  const taskHeight = 100;
  
  Object.entries(tasksByLevel).forEach(([level, taskIds]) => {
    taskIds.forEach((taskId, idx) => {
      positions.push({
        id: taskId,
        x: parseInt(level) * levelWidth + 20,
        y: idx * taskHeight + 20 + (idx * 20)
      });
    });
  });
  
  return positions;
}
