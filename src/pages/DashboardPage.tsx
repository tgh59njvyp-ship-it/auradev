import React from 'react';
import {
  Sparkles,
  Key,
  Cpu,
  FolderGit2,
  Terminal,
  Bot,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Plus,
  Play
} from 'lucide-react';
import { Project, ChatSession, CustomModel, UserProviderKey, Agent, UsageLog } from '../types';
import { PROVIDERS_META } from '../constants/providers';

interface DashboardPageProps {
  keys: UserProviderKey[];
  models: CustomModel[];
  projects: Project[];
  chats: ChatSession[];
  agents: Agent[];
  usage: UsageLog[];
  fixedModel?: CustomModel;
  onNavigate: (tab: string) => void;
  onOpenProject: (projectId: string) => void;
  onOpenChat: (chatId: string) => void;
  isDemoMode: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  keys,
  models,
  projects,
  chats,
  agents,
  usage,
  fixedModel,
  onNavigate,
  onOpenProject,
  onOpenChat,
  isDemoMode
}) => {
  const connectedKeys = keys.filter(k => k.status === 'connected');
  const hasNoKeys = connectedKeys.length === 0;

  // Usage totals
  const totalRequests = usage.length;
  const totalTokens = usage.reduce((sum, u) => sum + (u.totalTokens || 0), 0);
  const totalCost = usage.reduce((sum, u) => sum + (u.estimatedCost || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles size={16} />
            <span>AI Development Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Welcome back to <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">AURA DEV</span>
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            自分のAPIキーで、自分専用のAI開発環境を作る。<br className="hidden sm:inline" />
            プロバイダーの制約を受けず、任意のModel IDでチャット、アプリ自動生成、AIコード編集、エージェントを実行できます。
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              onClick={() => onNavigate('build')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Terminal size={15} />
              <span>Create Project (Build)</span>
            </button>

            <button
              onClick={() => onNavigate('chat')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles size={15} className="text-indigo-400" />
              <span>New Chat</span>
            </button>

            <button
              onClick={() => onNavigate('models')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Cpu size={14} className="text-cyan-400" />
              <span>Add Model (BYOM)</span>
            </button>

            <button
              onClick={() => onNavigate('keys')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Key size={14} className="text-emerald-400" />
              <span>Add API Key</span>
            </button>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* First-time Setup Alert if 0 Keys Connected */}
      {hasNoKeys && !isDemoMode && (
        <div className="p-6 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-2 border-amber-500/40 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Connect your first AI provider</h3>
                <p className="text-xs text-slate-300">
                  AURA DEVの機能を完全利用するには、優先プロバイダーのAPIキーを1つ以上登録してください。
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('keys')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0"
            >
              Open API Keys
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-500/20">
            {['gemini', 'openai', 'openrouter', 'groq'].map(pId => {
              const meta = PROVIDERS_META[pId];
              return (
                <div
                  key={pId}
                  onClick={() => onNavigate('keys')}
                  className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl hover:border-indigo-500 cursor-pointer transition text-xs space-y-1"
                >
                  <div className="font-semibold text-white">{meta.name}</div>
                  <div className="text-[10px] text-indigo-400">Register Key →</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Connected Providers</span>
            <Key size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{connectedKeys.length}</div>
          <div className="text-[10px] text-slate-400 font-mono">
            {connectedKeys.map(k => k.providerId).join(', ') || 'None connected'}
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Custom Models</span>
            <Cpu size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{models.length}</div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            {fixedModel ? (
              <span className="text-amber-400 font-medium truncate">Fixed: {fixedModel.modelName}</span>
            ) : (
              'No fixed model'
            )}
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Projects</span>
            <FolderGit2 size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{projects.length}</div>
          <div className="text-[10px] text-slate-400">Ready for editing</div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total AI Requests</span>
            <Layers size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalRequests}</div>
          <div className="text-[10px] text-slate-400 font-mono">
            ~{totalTokens.toLocaleString()} tokens
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderGit2 size={17} className="text-indigo-400" />
              <span>Recent Projects</span>
            </h2>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {projects.slice(0, 4).map(proj => (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj.id)}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition cursor-pointer flex items-center justify-between group"
              >
                <div className="truncate pr-3 space-y-0.5">
                  <div className="font-semibold text-xs text-white group-hover:text-indigo-300 transition truncate">
                    {proj.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {proj.files.length} files • {proj.description || 'Web application'}
                  </div>
                </div>
                <ArrowRight size={13} className="text-slate-500 group-hover:text-indigo-400 transition" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Chats */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={17} className="text-indigo-400" />
              <span>Recent Conversations</span>
            </h2>
            <button
              onClick={() => onNavigate('chat')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Open Chat</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {chats.slice(0, 4).map(chat => (
              <div
                key={chat.id}
                onClick={() => onOpenChat(chat.id)}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition cursor-pointer flex items-center justify-between group"
              >
                <div className="truncate pr-3 space-y-0.5">
                  <div className="font-semibold text-xs text-white group-hover:text-indigo-300 transition truncate">
                    {chat.title || 'Untitled Session'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {chat.modelName || chat.modelId} • {chat.messages.length} messages
                  </div>
                </div>
                <ArrowRight size={13} className="text-slate-500 group-hover:text-indigo-400 transition" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agents & Connected Providers Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bot size={17} className="text-indigo-400" />
              <span>Autonomous Agents</span>
            </h2>
            <button
              onClick={() => onNavigate('agents')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Manage Agents</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {agents.map(ag => (
              <div
                key={ag.id}
                onClick={() => onNavigate('agents')}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-xs text-white">{ag.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{ag.modelId}</p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] rounded font-mono">
                  {ag.tools?.filter(t => t.enabled).length || 0} tools
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* My Registered Models Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu size={17} className="text-indigo-400" />
              <span>My Models (BYOM)</span>
            </h2>
            <button
              onClick={() => onNavigate('models')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Configure Models</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {models.slice(0, 4).map(mod => (
              <div
                key={mod.id}
                onClick={() => onNavigate('models')}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-xs text-white truncate">{mod.modelName}</span>
                    {mod.isFixed && (
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                        <Lock size={10} /> FIXED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono truncate">{mod.modelId}</div>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">{mod.providerId}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
