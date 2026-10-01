import React, { useState, useEffect, useRef } from 'react';
import { Header, Sidebar } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { ModelsPage } from './pages/ModelsPage';
import { ChatPage } from './pages/ChatPage';
import { BuildPage } from './pages/BuildPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { AgentsPage } from './pages/AgentsPage';
import { UsagePage } from './pages/UsagePage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import {
  UserProviderKey,
  CustomModel,
  Project,
  ChatSession,
  Agent,
  UsageLog,
  UserSettings,
  ProviderId,
  FileDiffProposal
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Core Data States
  const [keys, setKeys] = useState<UserProviderKey[]>([]);
  const [models, setModels] = useState<CustomModel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [usage, setUsage] = useState<UsageLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    autoMode: false,
    allowedProvidersForAuto: ['gemini', 'openrouter'],
    isDemoMode: false
  });

  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [activeChatId, setActiveChatId] = useState<string | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const streamAbortControllerRef = useRef<AbortController | null>(null);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Load from Server
  const loadData = async () => {
    try {
      const [keysRes, modelsRes, projectsRes, chatsRes, agentsRes, usageRes, meRes] = await Promise.all([
        api.getKeys(),
        api.getModels(),
        api.getProjects(),
        api.getChats(),
        api.getAgents(),
        api.getUsage(),
        api.getMe()
      ]);

      setKeys(keysRes.keys || []);
      setModels(modelsRes.models || []);
      setProjects(projectsRes.projects || []);
      setChats(chatsRes.chats || []);
      setAgents(agentsRes.agents || []);
      setUsage(usageRes.usage || []);
      if (meRes.settings) {
        setSettings({
          ...meRes.settings,
          theme: meRes.settings.theme === 'light' ? 'light' : 'dark'
        });
      }
      if (projectsRes.projects?.[0]) {
        setActiveProjectId(projectsRes.projects[0].id);
      }
      if (chatsRes.chats?.[0]) {
        setActiveChatId(chatsRes.chats[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load initial data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fixedModel = models.find(m => m.isFixed);

  // Settings & Theme
  const handleToggleTheme = async () => {
    const newTheme: 'dark' | 'light' = settings.theme === 'dark' ? 'light' : 'dark';
    const updated: UserSettings = { ...settings, theme: newTheme };
    setSettings(updated);
    await api.updateSettings({ theme: newTheme });
  };

  const handleToggleDemoMode = async () => {
    const newDemo = !settings.isDemoMode;
    const updated: UserSettings = { ...settings, isDemoMode: newDemo };
    setSettings(updated);
    await api.updateSettings({ isDemoMode: newDemo });
    showToast(newDemo ? 'Demo Mode Enabled (Simulated Responses)' : 'Live API Mode Activated', newDemo ? 'info' : 'success');
  };

  // API Key handlers
  const handleSaveKey = async (payload: {
    providerId: ProviderId;
    apiKey: string;
    customBaseUrl?: string;
    customProviderName?: string;
    testImmediately?: boolean;
  }) => {
    try {
      const res = await api.saveKey(payload);
      setKeys(res.keys);
      if (res.status === 'connected') {
        showToast(`✓ ${payload.providerId} connected successfully!`, 'success');
      } else if (res.status === 'error') {
        showToast(`✕ Connection error: ${res.errorMessage}`, 'error');
      } else {
        showToast('API Key saved', 'success');
      }
    } catch (err: any) {
      showToast('Failed to save API key', 'error');
    }
  };

  const handleTestKey = async (payload: {
    providerId: ProviderId;
    tempApiKey?: string;
    customBaseUrl?: string;
  }) => {
    return await api.testKey(payload);
  };

  const handleRemoveKey = async (providerId: ProviderId) => {
    try {
      const res = await api.removeKey(providerId);
      setKeys(res.keys);
      showToast(`Key removed for ${providerId}`, 'info');
    } catch {
      showToast('Failed to remove key', 'error');
    }
  };

  // Custom Models handlers
  const handleSaveModel = async (model: Partial<CustomModel>) => {
    try {
      const res = await api.saveModel(model);
      setModels(res.models);
      showToast(`Model "${model.modelName}" saved!`, 'success');
    } catch (err: any) {
      showToast('Failed to save model', 'error');
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      const res = await api.deleteModel(modelId);
      setModels(res.models);
      showToast('Model deleted', 'info');
    } catch {
      showToast('Failed to delete model', 'error');
    }
  };

  const handleSetFixedModel = async (modelId: string) => {
    try {
      const res = await api.setFixedModel(modelId);
      setModels(res.models);
      const chosen = res.models.find(m => m.id === modelId);
      showToast(`🔒 Fixed Model set to "${chosen?.modelName}"`, 'success');
    } catch {
      showToast('Failed to fix model', 'error');
    }
  };

  const handleTestModel = async (payload: { providerId: ProviderId; modelId: string }) => {
    return await api.testModel(payload);
  };

  const handleDiscoverModels = async (providerId: ProviderId) => {
    const res = await api.discoverModels(providerId);
    return res.models || [];
  };

  const handleExportModels = async () => {
    await api.exportModelsJson();
    showToast('Exported models to JSON (Zero API Keys included)', 'success');
  };

  const handleImportModels = async (items: any[]) => {
    const res = await api.importModelsJson(items);
    setModels(res.models);
    showToast(`Successfully imported ${items.length} models!`, 'success');
  };

  // Chat handlers
  const handleNewChat = () => {
    const newChat: ChatSession = {
      id: `chat_${Date.now()}`,
      userId: api.getUserId(),
      title: 'New Session',
      providerId: fixedModel?.providerId || 'gemini',
      modelId: fixedModel?.modelId || 'gemini-2.5-flash',
      modelName: fixedModel?.modelName || 'Gemini 2.5 Flash',
      messages: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setCurrentTab('chat');
  };

  const handleDeleteChat = async (chatId: string) => {
    const res = await api.deleteChat(chatId);
    setChats(res.chats);
    if (activeChatId === chatId) {
      setActiveChatId(res.chats[0]?.id);
    }
    showToast('Chat deleted', 'info');
  };

  const handleSendMessage = async (payload: {
    chatId?: string;
    content: string;
    providerId: ProviderId;
    modelId: string;
    modelName: string;
    isTemporaryModel?: boolean;
    attachments?: any[];
  }) => {
    const targetChat = chats.find(c => c.id === payload.chatId) || chats[0];
    if (!targetChat) return;

    const userMessage = {
      id: `m_${Date.now()}`,
      role: 'user' as const,
      content: payload.content,
      timestamp: new Date().toISOString(),
      attachments: payload.attachments
    };

    const assistantMsgId = `m_${Date.now() + 1}`;
    const assistantMessage = {
      id: assistantMsgId,
      role: 'assistant' as const,
      content: '',
      timestamp: new Date().toISOString(),
      providerId: payload.providerId,
      modelId: payload.modelId,
      modelName: payload.modelName,
      isTemporaryModel: payload.isTemporaryModel
    };

    const updatedMessages = [...targetChat.messages, userMessage, assistantMessage];
    const newTitle =
      targetChat.messages.length === 0
        ? payload.content.slice(0, 28) || 'Chat Session'
        : targetChat.title;

    const updatedChat: ChatSession = {
      ...targetChat,
      title: newTitle,
      providerId: payload.providerId,
      modelId: payload.modelId,
      modelName: payload.modelName,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    // Update in local state
    setChats(prev => prev.map(c => (c.id === updatedChat.id ? updatedChat : c)));
    setIsStreaming(true);

    const abortController = new AbortController();
    streamAbortControllerRef.current = abortController;

    let streamedContent = '';

    await api.streamChat(
      {
        providerId: payload.providerId,
        modelId: payload.modelId,
        modelName: payload.modelName,
        messages: targetChat.messages
          .concat(userMessage)
          .map(m => ({ role: m.role, content: m.content })),
        isDemoMode: settings.isDemoMode
      },
      (chunk: string) => {
        streamedContent += chunk;
        setChats(prev =>
          prev.map(c => {
            if (c.id === targetChat.id) {
              const msgs = c.messages.map(m => {
                if (m.id === assistantMsgId) {
                  return { ...m, content: streamedContent };
                }
                return m;
              });
              return { ...c, messages: msgs };
            }
            return c;
          })
        );
      },
      (tokens?: any) => {
        setIsStreaming(false);
        streamAbortControllerRef.current = null;
        // Save chat to server
        const finalChat: ChatSession = {
          ...updatedChat,
          messages: updatedChat.messages.map(m =>
            m.id === assistantMsgId ? { ...m, content: streamedContent } : m
          ),
          totalInputTokens: (updatedChat.totalInputTokens || 0) + (tokens?.input || 0),
          totalOutputTokens: (updatedChat.totalOutputTokens || 0) + (tokens?.output || 0)
        };
        api.saveChat(finalChat);
        // Refresh usage logs
        api.getUsage().then(u => setUsage(u.usage));
      },
      (errText: string) => {
        setIsStreaming(false);
        streamAbortControllerRef.current = null;
        showToast(errText, 'error');
        setChats(prev =>
          prev.map(c => {
            if (c.id === targetChat.id) {
              const msgs = c.messages.map(m => {
                if (m.id === assistantMsgId) {
                  return {
                    ...m,
                    content: `⚠️ Error occurred: ${errText}\n\nThis model is currently unavailable or returned an error. Please verify your API Key or select another model in Models/Settings.`
                  };
                }
                return m;
              });
              return { ...c, messages: msgs };
            }
            return c;
          })
        );
      },
      abortController.signal
    );
  };

  const handleStopGeneration = () => {
    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
      streamAbortControllerRef.current = null;
      setIsStreaming(false);
      showToast('Generation halted', 'info');
    }
  };

  // Build Mode handler
  const handleGenerateProject = async (payload: {
    prompt: string;
    templateType: 'web' | 'react' | 'node' | 'static';
    providerId: ProviderId;
    modelId: string;
  }) => {
    const res = await api.buildProject({
      ...payload,
      isDemoMode: settings.isDemoMode
    });
    if (res.error) throw new Error(res.error);
    const updated = await api.getProjects();
    setProjects(updated.projects);
    setActiveProjectId(res.project.id);
    showToast(`Project "${res.project.name}" generated!`, 'success');
    return res.project;
  };

  // Project Editor & AI Code Edit handler
  const handleCreateProject = async (name: string, description?: string) => {
    const res = await api.saveProject({
      name,
      description,
      templateType: 'web'
    });
    const updated = await api.getProjects();
    setProjects(updated.projects);
    setActiveProjectId(res.project.id);
    showToast(`Project "${name}" created!`, 'success');
    return res.project;
  };

  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    const res = await api.updateProject(id, updates);
    setProjects(prev => prev.map(p => (p.id === id ? res.project : p)));
  };

  const handleDeleteProject = async (id: string) => {
    const res = await api.deleteProject(id);
    setProjects(res.projects);
    if (activeProjectId === id) {
      setActiveProjectId(res.projects[0]?.id);
    }
    showToast('Project deleted', 'info');
  };

  const handleProposeEdit = async (payload: {
    projectId: string;
    filePath: string;
    instruction: string;
    providerId: ProviderId;
    modelId: string;
  }): Promise<FileDiffProposal> => {
    const res = await api.proposeEdit({
      ...payload,
      isDemoMode: settings.isDemoMode
    });
    if (res.error) throw new Error(res.error);
    return res;
  };

  const handleApplyCodeToProject = async (projectId: string, fileName: string, code: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const existingFile = proj.files.find(f => f.path === fileName);
    let updatedFiles = [];
    if (existingFile) {
      updatedFiles = proj.files.map(f => (f.path === fileName ? { ...f, content: code } : f));
    } else {
      updatedFiles = [
        ...proj.files,
        {
          path: fileName,
          content: code,
          language: fileName.split('.').pop() || 'ts',
          updatedAt: new Date().toISOString()
        }
      ];
    }

    await handleUpdateProject(projectId, { files: updatedFiles, activeFilePath: fileName });
    setActiveProjectId(projectId);
    setCurrentTab('projects');
    showToast(`Applied code to ${proj.name} (${fileName})`, 'success');
  };

  // Agents
  const handleSaveAgent = async (agent: Partial<Agent> & { name: string; systemPrompt: string }) => {
    const res = await api.saveAgent(agent);
    const updated = await api.getAgents();
    setAgents(updated.agents);
    showToast(`Agent "${res.agent.name}" saved!`, 'success');
  };

  const handleDeleteAgent = async (agentId: string) => {
    const res = await api.deleteAgent(agentId);
    setAgents(res.agents);
    showToast('Agent deleted', 'info');
  };

  const handleQuickAction = (action: 'chat' | 'build' | 'model' | 'key') => {
    if (action === 'chat') {
      handleNewChat();
    } else if (action === 'build') {
      setCurrentTab('build');
    } else if (action === 'model') {
      setCurrentTab('models');
    } else if (action === 'key') {
      setCurrentTab('keys');
    }
  };

  const connectedKeysCount = keys.filter(k => k.status === 'connected').length;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${settings.theme === 'light' ? 'light-mode' : ''}`}>
      {/* Top Header */}
      <Header
        onOpenMobileNav={() => setMobileNavOpen(true)}
        isDemoMode={settings.isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        connectedKeysCount={connectedKeysCount}
        fixedModel={fixedModel}
        onQuickAction={handleQuickAction}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          fixedModel={fixedModel}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              keys={keys}
              models={models}
              projects={projects}
              chats={chats}
              agents={agents}
              usage={usage}
              fixedModel={fixedModel}
              onNavigate={setCurrentTab}
              onOpenProject={id => {
                setActiveProjectId(id);
                setCurrentTab('projects');
              }}
              onOpenChat={id => {
                setActiveChatId(id);
                setCurrentTab('chat');
              }}
              isDemoMode={settings.isDemoMode}
            />
          )}

          {currentTab === 'chat' && (
            <ChatPage
              chats={chats}
              currentChatId={activeChatId}
              onSelectChat={setActiveChatId}
              onNewChat={handleNewChat}
              onDeleteChat={handleDeleteChat}
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              isStreaming={isStreaming}
              models={models}
              fixedModel={fixedModel}
              projects={projects}
              onApplyCodeToProject={handleApplyCodeToProject}
              isDemoMode={settings.isDemoMode}
            />
          )}

          {currentTab === 'build' && (
            <BuildPage
              onGenerateProject={handleGenerateProject}
              models={models}
              fixedModel={fixedModel}
              onOpenProject={id => {
                setActiveProjectId(id);
                setCurrentTab('projects');
              }}
              isDemoMode={settings.isDemoMode}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsPage
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={setActiveProjectId}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onProposeEdit={handleProposeEdit}
              models={models}
              fixedModel={fixedModel}
              isDemoMode={settings.isDemoMode}
            />
          )}

          {currentTab === 'models' && (
            <ModelsPage
              models={models}
              onSaveModel={handleSaveModel}
              onDeleteModel={handleDeleteModel}
              onSetFixedModel={handleSetFixedModel}
              onTestModel={handleTestModel}
              onDiscoverModels={handleDiscoverModels}
              onExportModels={handleExportModels}
              onImportModels={handleImportModels}
              onSelectModelForChat={m => {
                setCurrentTab('chat');
              }}
            />
          )}

          {currentTab === 'keys' && (
            <ApiKeysPage
              keys={keys}
              onSaveKey={handleSaveKey}
              onTestKey={handleTestKey}
              onRemoveKey={handleRemoveKey}
            />
          )}

          {currentTab === 'agents' && (
            <AgentsPage
              agents={agents}
              models={models}
              onSaveAgent={handleSaveAgent}
              onDeleteAgent={handleDeleteAgent}
              isDemoMode={settings.isDemoMode}
            />
          )}

          {currentTab === 'usage' && <UsagePage usage={usage} />}

          {currentTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={async u => {
                const updated = await api.updateSettings(u);
                setSettings(updated.settings);
                showToast('Settings saved', 'success');
              }}
            />
          )}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-2 border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-indigo-600 text-white border-indigo-500'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
