import React, { useState } from 'react';
import {
  Bot,
  Plus,
  Play,
  Settings,
  Trash2,
  Wrench,
  Search,
  FileText,
  Code2,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Terminal,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { Agent, CustomModel, ProviderId, AgentToolConfig } from '../types';

interface AgentsPageProps {
  agents: Agent[];
  models: CustomModel[];
  onSaveAgent: (agent: Partial<Agent> & { name: string; systemPrompt: string }) => Promise<void>;
  onDeleteAgent: (agentId: string) => Promise<void>;
  isDemoMode: boolean;
}

const DEFAULT_TOOLS: AgentToolConfig[] = [
  { id: 'web_search', name: 'Web Search', description: 'Search web documentation and npm packages', enabled: true, requiresConfirmation: false },
  { id: 'file_read', name: 'File Read', description: 'Inspect workspace files', enabled: true, requiresConfirmation: false },
  { id: 'file_write', name: 'File Write', description: 'Write or modify code in project files', enabled: true, requiresConfirmation: true },
  { id: 'code_gen', name: 'Code Generation', description: 'Synthesize new full stack components', enabled: true, requiresConfirmation: false },
  { id: 'json_gen', name: 'JSON Schema Validation', description: 'Produce validated structured JSON data', enabled: true, requiresConfirmation: false }
];

export const AgentsPage: React.FC<AgentsPageProps> = ({
  agents,
  models,
  onSaveAgent,
  onDeleteAgent,
  isDemoMode
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id || '');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [tools, setTools] = useState<AgentToolConfig[]>(DEFAULT_TOOLS);
  const [memoryEnabled, setMemoryEnabled] = useState(true);

  // Execution modal test
  const [executingAgent, setExecutingAgent] = useState<Agent | null>(null);
  const [execPrompt, setExecPrompt] = useState('');
  const [execLogs, setExecLogs] = useState<{ step: string; content: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const resetForm = () => {
    setEditingAgent(null);
    setName('');
    setDescription('');
    setSystemPrompt('You are an expert autonomous software engineer. Assist the user with multi-step development tasks, rigorous testing, and code generation.');
    setSelectedModelId(models[0]?.id || '');
    setTemperature(0.7);
    setMaxTokens(4096);
    setTools(DEFAULT_TOOLS);
    setMemoryEnabled(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setDescription(agent.description || '');
    setSystemPrompt(agent.systemPrompt);
    setSelectedModelId(models.find(m => m.modelId === agent.modelId)?.id || models[0]?.id || '');
    setTemperature(agent.temperature);
    setMaxTokens(agent.maxTokens);
    setTools(agent.tools || DEFAULT_TOOLS);
    setMemoryEnabled(agent.memoryEnabled);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    const chosenModel = models.find(m => m.id === selectedModelId) || models[0];

    await onSaveAgent({
      id: editingAgent?.id,
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      providerId: chosenModel ? chosenModel.providerId : 'gemini',
      modelId: chosenModel ? chosenModel.modelId : 'gemini-2.5-flash',
      temperature,
      maxTokens,
      tools,
      memoryEnabled
    });

    setShowModal(false);
    resetForm();
  };

  const handleRunAgent = async (agent: Agent) => {
    setExecutingAgent(agent);
    setExecPrompt('');
    setExecLogs([]);
  };

  const handleExecute = async () => {
    if (!execPrompt.trim() || !execExecutingAgent) return;
    setIsRunning(true);
    setExecLogs([
      { step: 'Init', content: `Agent "${execExecutingAgent.name}" initialized with Model ${execExecutingAgent.modelId}` }
    ]);

    setTimeout(() => {
      setExecLogs(prev => [
        ...prev,
        { step: 'Tool: Web Search', content: 'Searching documentation and latest specs for request...' }
      ]);
    }, 600);

    setTimeout(() => {
      setExecLogs(prev => [
        ...prev,
        { step: 'Reasoning', content: 'Synthesizing architecture and formulating execution plan...' }
      ]);
    }, 1400);

    setTimeout(() => {
      setExecLogs(prev => [
        ...prev,
        { step: 'Tool: Code Generation', content: 'Autonomous tasks completed successfully. Output ready for review.' }
      ]);
      setIsRunning(false);
    }, 2200);
  };

  const execExecutingAgent = executingAgent;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <Bot size={16} />
              <span>Autonomous AI Agents</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Agents Workspace
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              独自のシステムプロンプト、ツール権限（ファイル読み書き、Web検索、コード生成）、およびModel IDを紐づけた特化型AIエージェントを作成・実行できます。
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>Create Agent</span>
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div
            key={agent.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between transition"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{agent.name}</h3>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {agent.providerId} / {agent.modelId}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {agent.description || agent.systemPrompt}
              </p>

              {/* Tools Badges */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Tools:
                </span>
                <div className="flex flex-wrap gap-1">
                  {agent.tools
                    ?.filter(t => t.enabled)
                    .map(t => (
                      <span
                        key={t.id}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-300 font-mono"
                      >
                        {t.name}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleRunAgent(agent)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Play size={12} />
                <span>Run Agent</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openEditModal(agent)}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                  title="Edit Agent"
                >
                  <Settings size={14} />
                </button>
                <button
                  onClick={() => onDeleteAgent(agent.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition"
                  title="Delete Agent"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bot size={18} className="text-indigo-400" />
                <span>{editingAgent ? 'Edit Agent' : 'Create AI Agent'}</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Agent Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Stack Web Architect"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Specialized in clean React/TypeScript architecture and refactoring"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Model (BYOM) <span className="text-cyan-400">*</span>
                </label>
                <select
                  value={selectedModelId}
                  onChange={e => setSelectedModelId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.isFixed ? '🔒 ' : ''}{m.modelName} ({m.modelId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  System Prompt <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="You are an autonomous engineering assistant..."
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>

              {/* Tools selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Agent Tools</label>
                <div className="space-y-2">
                  {tools.map(tool => (
                    <div
                      key={tool.id}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={tool.enabled}
                          onChange={e => {
                            setTools(
                              tools.map(t => (t.id === tool.id ? { ...t, enabled: e.target.checked } : t))
                            );
                          }}
                          className="rounded text-indigo-600 bg-slate-900 border-slate-700"
                        />
                        <div>
                          <span className="font-semibold text-slate-200 block">{tool.name}</span>
                          <span className="text-[10px] text-slate-400">{tool.description}</span>
                        </div>
                      </div>

                      {tool.enabled && (
                        <label className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                          <input
                            type="checkbox"
                            checked={tool.requiresConfirmation}
                            onChange={e => {
                              setTools(
                                tools.map(t =>
                                  t.id === tool.id ? { ...t, requiresConfirmation: e.target.checked } : t
                                )
                              );
                            }}
                            className="rounded text-amber-500 bg-slate-900 border-slate-700"
                          />
                          <span>Confirm before run</span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Run Agent Test Modal */}
      {execExecutingAgent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Bot size={18} className="text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Execute Agent: {execExecutingAgent.name}</h3>
              </div>
              <button onClick={() => setExecutingAgent(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Instruction for Agent</label>
                <textarea
                  rows={3}
                  placeholder="Task for this agent..."
                  value={execPrompt}
                  onChange={e => setExecPrompt(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <button
                onClick={handleExecute}
                disabled={isRunning || !execPrompt.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                {isRunning ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                <span>Execute Agent Flow</span>
              </button>

              {/* Execution Steps */}
              {execLogs.length > 0 && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
                  <span className="text-[10px] text-slate-400 font-sans font-semibold block">Execution Trace:</span>
                  {execLogs.map((log, i) => (
                    <div key={i} className="flex items-start space-x-2 text-[11px]">
                      <span className="text-indigo-400 font-bold shrink-0">[{log.step}]</span>
                      <span className="text-slate-300">{log.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
