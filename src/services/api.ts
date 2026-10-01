import {
  ProviderId,
  UserProviderKey,
  CustomModel,
  Project,
  ChatSession,
  Agent,
  UsageLog,
  UserSettings,
  FileDiffProposal
} from '../types';

export class AuraApiClient {
  private userId: string;

  constructor() {
    this.userId = localStorage.getItem('aura_user_id') || 'aura_developer_default';
  }

  getUserId(): string {
    return this.userId;
  }

  setUserId(id: string) {
    this.userId = id;
    localStorage.setItem('aura_user_id', id);
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-user-id': this.userId
    };
  }

  // Settings & Profile
  async getMe(): Promise<{ userId: string; settings: UserSettings; environmentKeysConfigured: { gemini: boolean } }> {
    const res = await fetch('/api/me', { headers: this.getHeaders() });
    return res.json();
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<{ success: boolean; settings: UserSettings }> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings)
    });
    return res.json();
  }

  // API Keys
  async getKeys(): Promise<{ keys: UserProviderKey[] }> {
    const res = await fetch('/api/keys', { headers: this.getHeaders() });
    return res.json();
  }

  async saveKey(payload: {
    providerId: ProviderId;
    apiKey: string;
    customBaseUrl?: string;
    customProviderName?: string;
    testImmediately?: boolean;
  }): Promise<{ success: boolean; status: string; errorMessage?: string; keys: UserProviderKey[] }> {
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async testKey(payload: {
    providerId: ProviderId;
    tempApiKey?: string;
    customBaseUrl?: string;
  }): Promise<{ success: boolean; status: 'connected' | 'error'; message: string }> {
    const res = await fetch('/api/keys/test', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async removeKey(providerId: ProviderId): Promise<{ success: boolean; keys: UserProviderKey[] }> {
    const res = await fetch(`/api/keys/${providerId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  }

  // Custom Models
  async getModels(): Promise<{ models: CustomModel[] }> {
    const res = await fetch('/api/models', { headers: this.getHeaders() });
    return res.json();
  }

  async saveModel(model: Partial<CustomModel>): Promise<{ success: boolean; model: CustomModel; models: CustomModel[] }> {
    const res = await fetch('/api/models', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(model)
    });
    return res.json();
  }

  async testModel(payload: {
    providerId: ProviderId;
    modelId: string;
    customBaseUrl?: string;
  }): Promise<{ available: boolean; latencyMs: number; message?: string; errorType?: string }> {
    const res = await fetch('/api/models/test', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async setFixedModel(modelId: string): Promise<{ success: boolean; models: CustomModel[] }> {
    const res = await fetch(`/api/models/${modelId}/fixed`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.json();
  }

  async deleteModel(modelId: string): Promise<{ success: boolean; models: CustomModel[] }> {
    const res = await fetch(`/api/models/${modelId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  }

  async discoverModels(providerId: ProviderId): Promise<{ models: any[] }> {
    const res = await fetch(`/api/models/discover/${providerId}`, { headers: this.getHeaders() });
    return res.json();
  }

  async exportModelsJson(): Promise<void> {
    const res = await fetch('/api/models/export', { headers: this.getHeaders() });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-models-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async importModelsJson(models: any[]): Promise<{ success: boolean; models: CustomModel[] }> {
    const res = await fetch('/api/models/import', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(models)
    });
    return res.json();
  }

  // Chat Streaming
  async streamChat(
    payload: {
      providerId: ProviderId;
      modelId: string;
      modelName?: string;
      messages: { role: string; content: string }[];
      systemInstruction?: string;
      temperature?: number;
      isDemoMode?: boolean;
    },
    onChunk: (chunk: string) => void,
    onDone: (tokens?: { input: number; output: number; total: number }) => void,
    onError: (err: string) => void,
    signal?: AbortSignal
  ) {
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            }
            if (parsed.done) {
              onDone(parsed.tokens);
              return;
            }
          } catch {
            // ignore partial json
          }
        }
      }
      onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stream intentionally stopped by user
        return;
      }
      onError(err.message || 'Stream connection error');
    }
  }

  // Build Mode
  async buildProject(payload: {
    prompt: string;
    templateType?: string;
    providerId: ProviderId;
    modelId: string;
    isDemoMode?: boolean;
  }): Promise<{ success: boolean; project: Project; error?: string }> {
    const res = await fetch('/api/build/generate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  // Code Diff & Edit
  async proposeEdit(payload: {
    projectId: string;
    filePath: string;
    instruction: string;
    providerId: ProviderId;
    modelId: string;
    isDemoMode?: boolean;
  }): Promise<FileDiffProposal & { error?: string }> {
    const res = await fetch('/api/edit/propose', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  // Projects
  async getProjects(): Promise<{ projects: Project[] }> {
    const res = await fetch('/api/projects', { headers: this.getHeaders() });
    return res.json();
  }

  async getProject(id: string): Promise<{ project: Project }> {
    const res = await fetch(`/api/projects/${id}`, { headers: this.getHeaders() });
    return res.json();
  }

  async saveProject(project: Partial<Project> & { name: string }): Promise<{ success: boolean; project: Project }> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(project)
    });
    return res.json();
  }

  async updateProject(id: string, project: Partial<Project>): Promise<{ success: boolean; project: Project }> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(project)
    });
    return res.json();
  }

  async deleteProject(id: string): Promise<{ success: boolean; projects: Project[] }> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  }

  // Chats
  async getChats(): Promise<{ chats: ChatSession[] }> {
    const res = await fetch('/api/chats', { headers: this.getHeaders() });
    return res.json();
  }

  async saveChat(chat: ChatSession): Promise<{ success: boolean; chat: ChatSession }> {
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(chat)
    });
    return res.json();
  }

  async deleteChat(id: string): Promise<{ success: boolean; chats: ChatSession[] }> {
    const res = await fetch(`/api/chats/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  }

  // Agents
  async getAgents(): Promise<{ agents: Agent[] }> {
    const res = await fetch('/api/agents', { headers: this.getHeaders() });
    return res.json();
  }

  async saveAgent(agent: Partial<Agent> & { name: string; systemPrompt: string }): Promise<{ success: boolean; agent: Agent }> {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(agent)
    });
    return res.json();
  }

  async deleteAgent(id: string): Promise<{ success: boolean; agents: Agent[] }> {
    const res = await fetch(`/api/agents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return res.json();
  }

  // Usage
  async getUsage(): Promise<{ usage: UsageLog[] }> {
    const res = await fetch('/api/usage', { headers: this.getHeaders() });
    return res.json();
  }
}

export const api = new AuraApiClient();
