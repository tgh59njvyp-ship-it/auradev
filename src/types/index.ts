export type ProviderId =
  | 'gemini'
  | 'openai'
  | 'openrouter'
  | 'groq'
  | 'anthropic'
  | 'mistral'
  | 'cerebras'
  | 'xai'
  | 'deepseek'
  | 'github'
  | 'custom';

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  category: 'priority1' | 'priority2' | 'priority3';
  description: string;
  defaultBaseUrl?: string;
  apiKeyHelpUrl: string;
  placeholderKey: string;
  supportsModelDiscovery: boolean;
  defaultModels: { modelId: string; modelName: string; description: string; contextLength?: number }[];
}

export interface UserProviderKey {
  providerId: ProviderId;
  maskedKey: string;
  status: 'connected' | 'not_connected' | 'error';
  lastTestedAt?: string;
  errorMessage?: string;
  customBaseUrl?: string;
  customProviderName?: string;
}

export interface ModelCapability {
  text: boolean;
  vision: boolean;
  image: boolean;
  audio: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
}

export interface CustomModel {
  id: string;
  userId: string;
  providerId: ProviderId;
  modelName: string; // UI display name (e.g. "Coding Pro")
  modelId: string;   // Actual identifier sent to API (e.g. "deepseek/deepseek-chat")
  description?: string;
  contextLength?: number;
  inputPrice?: number; // per 1M tokens or similar
  outputPrice?: number;
  capabilities: ModelCapability;
  isFixed: boolean;
  createdAt: string;
  updatedAt: string;
  isCustomProvider?: boolean;
  customBaseUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  providerId?: ProviderId;
  modelId?: string;
  modelName?: string;
  isTemporaryModel?: boolean;
  tokens?: {
    input?: number;
    output?: number;
    total?: number;
  };
  attachments?: {
    name: string;
    type: string;
    size: number;
    content?: string;
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  providerId: ProviderId;
  modelId: string;
  modelName: string;
  messages: ChatMessage[];
  totalInputTokens: number;
  totalOutputTokens: number;
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  files: ProjectFile[];
  templateType: 'web' | 'react' | 'node' | 'static';
  createdAt: string;
  updatedAt: string;
  activeFilePath?: string;
}

export interface FileDiffProposal {
  path: string;
  originalContent: string;
  proposedContent: string;
  summary: string;
}

export interface AgentToolConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiresConfirmation: boolean;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  systemPrompt: string;
  providerId: ProviderId;
  modelId: string;
  temperature: number;
  maxTokens: number;
  tools: AgentToolConfig[];
  memoryEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageLog {
  id: string;
  userId: string;
  timestamp: string;
  providerId: ProviderId;
  modelId: string;
  modelName: string;
  action: 'chat' | 'build' | 'edit' | 'agent' | 'test';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number | null; // null if unknown
  status: 'success' | 'error';
}

export interface UserSettings {
  theme: 'dark' | 'light';
  autoMode: boolean;
  allowedProvidersForAuto: ProviderId[];
  isDemoMode: boolean;
  githubTokenMasked?: string;
  githubConnected?: boolean;
}
