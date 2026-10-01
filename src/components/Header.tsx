import React from 'react';
import {
  Sparkles,
  Shield,
  Key,
  Layers,
  Cpu,
  Terminal,
  Bot,
  BarChart2,
  FolderGit2,
  Settings as SettingsIcon,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
  Lock,
  Zap,
  Plus
} from 'lucide-react';
import { CustomModel } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  fixedModel?: CustomModel;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  fixedModel
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'chat', label: 'AI Chat', icon: Sparkles },
    { id: 'build', label: 'Build Mode', icon: Terminal, badge: 'Core' },
    { id: 'projects', label: 'Projects & Editor', icon: FolderGit2 },
    { id: 'models', label: 'Models (BYOM)', icon: Cpu },
    { id: 'keys', label: 'API Keys (BYOK)', icon: Key },
    { id: 'agents', label: 'AI Agents', icon: Bot },
    { id: 'usage', label: 'Usage & Cost', icon: Layers },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 select-none ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-lg tracking-wider">A</span>
            </div>
            {(!collapsed || mobileOpen) && (
              <div>
                <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  AURA DEV
                </span>
                <span className="text-[10px] block text-cyan-400 font-mono tracking-widest uppercase">
                  BYOK Studio
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Fixed Model Indicator in Sidebar */}
        {(!collapsed || mobileOpen) && fixedModel && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow-xs">
            <div className="flex items-center justify-between text-[11px] text-amber-400 font-medium mb-1">
              <span className="flex items-center gap-1">
                <Lock size={12} /> FIXED MODEL
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">{fixedModel.providerId}</span>
            </div>
            <div className="text-xs font-semibold text-white truncate" title={fixedModel.modelName}>
              {fixedModel.modelName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate" title={fixedModel.modelId}>
              {fixedModel.modelId}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  size={20}
                  className={`shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />
                {(!collapsed || mobileOpen) && (
                  <span className="ml-3 truncate flex-1 text-left">{item.label}</span>
                )}
                {(!collapsed || mobileOpen) && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        {(!collapsed || mobileOpen) && (
          <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield size={12} className="text-emerald-400" /> AES-256 Vault
              </span>
              <span className="font-mono text-[10px]">v1.0.0</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Bring Your Own Key &amp; Model
            </p>
          </div>
        )}
      </aside>
    </>
  );
};

interface HeaderProps {
  onOpenMobileNav: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  connectedKeysCount: number;
  fixedModel?: CustomModel;
  onQuickAction: (action: 'chat' | 'build' | 'model' | 'key') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileNav,
  isDemoMode,
  onToggleDemoMode,
  connectedKeysCount,
  fixedModel,
  onQuickAction,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileNav}
          aria-label="メニューを開く"
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <Menu size={20} />
        </button>

        {/* Demo Mode Toggle Banner */}
        <div className="flex items-center space-x-2">
          {isDemoMode ? (
            <div className="flex items-center space-x-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
              <Zap size={14} className="text-amber-400" />
              <span>DEMO MODE</span>
              <button
                onClick={onToggleDemoMode}
                className="ml-1 text-[11px] underline text-amber-200 hover:text-white"
                title="Switch to Real AI API execution"
              >
                Disable
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE API READY</span>
              <button
                onClick={onToggleDemoMode}
                className="ml-1 text-[10px] text-slate-400 hover:text-slate-200"
                title="Switch to safe demo mode"
              >
                (Demo Mode)
              </button>
            </div>
          )}
        </div>

        {/* Current Fixed Model Preview in Header (Hidden on small mobile) */}
        {fixedModel && (
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
            <Lock size={13} className="text-amber-400" />
            <span className="text-slate-400">Fixed:</span>
            <span className="font-semibold text-white truncate max-w-[140px]">{fixedModel.modelName}</span>
            <code className="text-[11px] text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
              {fixedModel.modelId}
            </code>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Quick New Buttons */}
        <button
          onClick={() => onQuickAction('build')}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm cursor-pointer"
        >
          <Plus size={14} />
          <span>Build App</span>
        </button>

        <button
          onClick={() => onQuickAction('chat')}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
        >
          <Sparkles size={14} className="text-indigo-400" />
          <span>New Chat</span>
        </button>

        {/* Connected Keys Count */}
        <div
          onClick={() => onQuickAction('key')}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 cursor-pointer hover:border-slate-600 transition"
          title="Manage API Keys"
        >
          <Key size={14} className={connectedKeysCount > 0 ? 'text-emerald-400' : 'text-slate-400'} />
          <span>{connectedKeysCount} Keys</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'ライトテーマに切り替え' : 'ダークテーマに切り替え'}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
