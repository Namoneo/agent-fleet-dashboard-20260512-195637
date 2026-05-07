'use client';

import { useState } from 'react';
import { X, Swords, Trophy, GitCompare, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface AgentBattleProps {
  projects: any[];
  agents: any[];
  onClose: () => void;
}

interface BattleRun {
  agentId: number;
  agentName: string;
  runId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  logs: string[];
  duration: number;
}

export function AgentBattle({ projects, agents, onClose }: AgentBattleProps) {
  const [config, setConfig] = useState({
    projectId: '',
    prompt: '',
    agent1Id: '',
    agent2Id: '',
  });
  const [battle, setBattle] = useState<{
    runs: BattleRun[];
    status: 'idle' | 'running' | 'completed';
    winner: number | null;
  }>({
    runs: [],
    status: 'idle',
    winner: null,
  });

  async function startBattle() {
    setBattle({ runs: [], status: 'running', winner: null });
    
    const runs: BattleRun[] = [];
    
    // Launch both agents simultaneously
    for (const agentId of [config.agent1Id, config.agent2Id]) {
      const agent = agents.find(a => a.id.toString() === agentId);
      
      // Create task
      const taskRes = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: parseInt(config.projectId),
          title: `Battle: ${config.prompt.substring(0, 30)}...`,
          description: config.prompt,
          priority: 'high',
          assigned_agent_id: parseInt(agentId),
        }),
      });
      
      const task = await taskRes.json();
      
      // Launch agent
      const runRes = await fetch(`/api/agents/${agentId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          command: `echo "Agent ${agent.name} starting battle...\n${config.prompt}"`,
        }),
      });
      
      const runData = await runRes.json();
      
      runs.push({
        agentId: parseInt(agentId),
        agentName: agent.name,
        runId: runData.run_id,
        status: 'running',
        logs: [],
        duration: 0,
      });
    }
    
    setBattle({ runs, status: 'running', winner: null });
    
    // Poll for completion
    const startTime = Date.now();
    const interval = setInterval(async () => {
      const updatedRuns = await Promise.all(
        runs.map(async (run) => {
          const res = await fetch(`/api/runs/${run.runId}/output`);
          const logs = await res.json();
          return { ...run, logs: logs.map((l: any) => l.content), duration: Date.now() - startTime };
        })
      );
      
      const allDone = updatedRuns.every(r => r.logs.length > 0);
      
      setBattle({
        runs: updatedRuns,
        status: allDone ? 'completed' : 'running',
        winner: allDone ? determineWinner(updatedRuns) : null,
      });
      
      if (allDone) clearInterval(interval);
    }, 2000);
  }

  function determineWinner(runs: BattleRun[]): number {
    // Simple heuristic: faster agent wins, or agent with more output
    const run1 = runs[0];
    const run2 = runs[1];
    
    if (run1.duration < run2.duration) return run1.agentId;
    if (run2.duration < run1.duration) return run2.agentId;
    if (run1.logs.length > run2.logs.length) return run1.agentId;
    return run2.agentId;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-zinc-800 animate-slide-up">
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-800 bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-red-600/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center shadow-lg">
                <Swords className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Agent Battle Arena</h2>
                <p className="text-xs text-zinc-500">Pit two agents against each other on the same task</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Configuration */}
          {battle.status === 'idle' && (
            <>
              <div className="grid grid-cols-3 gap-6">
                {/* Project */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-zinc-400">Target Project</label>
                  <div className="space-y-2">
                    {projects.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setConfig({...config, projectId: p.id.toString()})}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          config.projectId === p.id.toString()
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-lg mr-2">{p.icon}</span>
                        <span className="text-sm">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agent 1 */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-zinc-400">Challenger 1</label>
                  <div className="space-y-2">
                    {agents.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setConfig({...config, agent1Id: a.id.toString()})}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          config.agent1Id === a.id.toString()
                            ? 'border-blue-500 bg-blue-500/10 text-white'
                            : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-lg mr-2">{a.type === 'codex' ? '💻' : '🧠'}</span>
                        <span className="text-sm font-medium">{a.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agent 2 */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-zinc-400">Challenger 2</label>
                  <div className="space-y-2">
                    {agents.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setConfig({...config, agent2Id: a.id.toString()})}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          config.agent2Id === a.id.toString()
                            ? 'border-purple-500 bg-purple-500/10 text-white'
                            : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:border-zinc-700'
                        }`}
                        disabled={config.agent1Id === a.id.toString()}
                      >
                        <span className="text-lg mr-2">{a.type === 'codex' ? '💻' : '🧠'}</span>
                        <span className="text-sm font-medium">{a.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-400">Battle Task</label>
                <textarea
                  value={config.prompt}
                  onChange={(e) => setConfig({...config, prompt: e.target.value})}
                  placeholder="e.g. 'Fix the auth bug in login.ts' or 'Refactor the API to use Zod validation'"
                  className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-amber-500/50 transition-all resize-none h-32 text-sm"
                />
              </div>

              {/* Start Battle */}
              <button
                onClick={startBattle}
                disabled={!config.projectId || !config.agent1Id || !config.agent2Id || !config.prompt}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20"
              >
                <Swords className="w-5 h-5" />
                Start Battle
              </button>
            </>
          )}

          {/* Battle in Progress */}
          {battle.status === 'running' && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-8">
                  {battle.runs.map((run, i) => (
                    <div key={run.agentId} className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl mb-2 animate-bounce">
                        {i === 0 ? '💻' : '🧠'}
                      </div>
                      <p className="text-sm font-bold text-zinc-300">{run.agentName}</p>
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mt-2 text-amber-500" />
                    </div>
                  ))}
                </div>
                <p className="text-zinc-500 text-sm">Agents are battling... Watch the results below</p>
              </div>
            </div>
          )}

          {/* Results */}
          {battle.status === 'completed' && (
            <div className="space-y-6">
              {/* Winner Banner */}
              {battle.winner && (
                <div className="bg-gradient-to-r from-amber-600/20 to-yellow-600/20 border border-amber-600/30 rounded-2xl p-6 text-center">
                  <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-amber-400">
                    🏆 {agents.find(a => a.id === battle.winner)?.name} Wins!
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">Faster execution and more comprehensive output</p>
                </div>
              )}

              {/* Side by Side Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {battle.runs.map((run, i) => (
                  <div key={run.agentId} className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
                    <div className={`px-4 py-3 border-b border-zinc-800 flex items-center justify-between ${
                      battle.winner === run.agentId ? 'bg-amber-600/10' : ''
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{i === 0 ? '💻' : '🧠'}</span>
                        <span className="font-bold text-zinc-300">{run.agentName}</span>
                        {battle.winner === run.agentId && <span className="text-amber-500 text-xs">WINNER</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {(run.duration / 1000).toFixed(1)}s
                      </div>
                    </div>
                    <div className="p-4 font-mono text-xs text-zinc-400 h-64 overflow-y-auto">
                      {run.logs.map((log, j) => (
                        <div key={j} className="py-0.5">
                          {log}
                        </div>
                      ))}
                      {run.logs.length === 0 && <span className="text-zinc-600 italic">No output yet...</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setBattle({ runs: [], status: 'idle', winner: null })}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors"
                >
                  New Battle
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
                >
                  Apply Winner's Solution
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
