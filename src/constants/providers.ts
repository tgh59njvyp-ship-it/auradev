import { ProviderMeta } from '../types';

export const PROVIDERS_META: Record<string, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    category: 'priority1',
    description: 'High performance multimodal AI with massive context window & tool use.',
    apiKeyHelpUrl: 'https://aistudio.google.com/app/apikey',
    placeholderKey: 'AIzaSy...',
    supportsModelDiscovery: true,
    defaultModels: [
      { modelId: 'gemini-3.8-flash', modelName: 'Gemini 3.8 Flash', description: 'Next-gen frontier reasoning & massive speed', contextLength: 1048576 },
      { modelId: 'gemini-3.5-flash', modelName: 'Gemini 3.5 Flash', description: 'Fast multimodal model', contextLength: 1048576 },
      { modelId: 'gemini-3.1-pro-preview', modelName: 'Gemini 3.1 Pro Preview', description: 'Advanced complex reasoning & code architecture', contextLength: 1048576 }
    ]
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    category: 'priority1',
    description: 'Industry-standard GPT models, reasoning models and function calling.',
    apiKeyHelpUrl: 'https://platform.openai.com/api-keys',
    placeholderKey: 'sk-proj-...',
    defaultBaseUrl: 'https://api.openai.com/v1',
    supportsModelDiscovery: true,
    defaultModels: [
      { modelId: 'gpt-4o', modelName: 'GPT-4o', description: 'Omni-model for high speed and complex reasoning', contextLength: 128000 },
      { modelId: 'gpt-4o-mini', modelName: 'GPT-4o Mini', description: 'Affordable, fast intelligence for coding & tasks', contextLength: 128000 },
      { modelId: 'o1', modelName: 'o1 Reasoning', description: 'Deep STEM and complex coding model', contextLength: 200000 },
      { modelId: 'o3-mini', modelName: 'o3-mini', description: 'Fast mathematical & algorithmic reasoning', contextLength: 200000 }
    ]
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'priority1',
    description: 'Unified API gateway for 200+ models from DeepSeek, Claude, Meta, Mistral, and more.',
    apiKeyHelpUrl: 'https://openrouter.ai/keys',
    placeholderKey: 'sk-or-v1-...',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    supportsModelDiscovery: true,
    defaultModels: [
      { modelId: 'deepseek/deepseek-r1', modelName: 'DeepSeek R1 (OpenRouter)', description: 'Open weights reasoning powerhouse', contextLength: 64000 },
      { modelId: 'deepseek/deepseek-chat', modelName: 'DeepSeek V3 (OpenRouter)', description: 'State-of-the-art general model at low cost', contextLength: 64000 },
      { modelId: 'anthropic/claude-3.5-sonnet', modelName: 'Claude 3.5 Sonnet (OpenRouter)', description: 'Industry benchmark for software engineering', contextLength: 200000 },
      { modelId: 'meta-llama/llama-3.3-70b-instruct', modelName: 'Llama 3.3 70B (OpenRouter)', description: 'Versatile open-source powerhouse', contextLength: 131072 }
    ]
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    category: 'priority1',
    description: 'Ultra-low latency LPU inference for open models like Llama 3 and DeepSeek.',
    apiKeyHelpUrl: 'https://console.groq.com/keys',
    placeholderKey: 'gsk_...',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    supportsModelDiscovery: true,
    defaultModels: [
      { modelId: 'llama-3.3-70b-versatile', modelName: 'Llama 3.3 70B Versatile', description: 'Fast, high-throughput intelligence', contextLength: 128000 },
      { modelId: 'llama-3.1-8b-instant', modelName: 'Llama 3.1 8B Instant', description: 'Instantaneous sub-second replies', contextLength: 128000 },
      { modelId: 'deepseek-r1-distill-llama-70b', modelName: 'DeepSeek R1 Distill 70B', description: 'Reasoning model powered by Groq LPU', contextLength: 128000 }
    ]
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    category: 'priority2',
    description: 'Claude 3.5 Sonnet & Claude 3.7 family for coding and architectural synthesis.',
    apiKeyHelpUrl: 'https://console.anthropic.com/settings/keys',
    placeholderKey: 'sk-ant-api03-...',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    supportsModelDiscovery: false,
    defaultModels: [
      { modelId: 'claude-3-7-sonnet-20250219', modelName: 'Claude 3.7 Sonnet', description: 'Hybrid reasoning and high performance coding', contextLength: 200000 },
      { modelId: 'claude-3-5-sonnet-20241022', modelName: 'Claude 3.5 Sonnet v2', description: 'World-class agentic coding model', contextLength: 200000 },
      { modelId: 'claude-3-5-haiku-20241022', modelName: 'Claude 3.5 Haiku', description: 'Fast and responsive intelligence', contextLength: 200000 }
    ]
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    category: 'priority2',
    description: 'European frontier models including Mistral Large and Codestral.',
    apiKeyHelpUrl: 'https://console.mistral.ai/api-keys',
    placeholderKey: '...',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    supportsModelDiscovery: true,
    defaultModels: [
      { modelId: 'codestral-latest', modelName: 'Codestral Latest', description: 'Specialized for coding across 80+ languages', contextLength: 256000 },
      { modelId: 'mistral-large-latest', modelName: 'Mistral Large 2', description: 'Top-tier multilingual general reasoning', contextLength: 128000 }
    ]
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    category: 'priority2',
    description: 'Wafer-scale engine with extreme tokens-per-second generation.',
    apiKeyHelpUrl: 'https://cloud.cerebras.ai/',
    placeholderKey: 'csk-...',
    defaultBaseUrl: 'https://api.cerebras.ai/v1',
    supportsModelDiscovery: true,
    defaultModels: [
      { modelId: 'llama-3.3-70b', modelName: 'Cerebras Llama 3.3 70B', description: 'Blazing speed ~2000 tokens/sec', contextLength: 128000 },
      { modelId: 'llama3.1-8b', modelName: 'Cerebras Llama 3.1 8B', description: 'Instantaneous response generation', contextLength: 8192 }
    ]
  },
  xai: {
    id: 'xai',
    name: 'xAI (Grok)',
    category: 'priority2',
    description: 'Grok models by xAI with real-time knowledge and coding abilities.',
    apiKeyHelpUrl: 'https://console.x.ai/',
    placeholderKey: 'xai-...',
    defaultBaseUrl: 'https://api.x.ai/v1',
    supportsModelDiscovery: true,
    defaultModels: [
      { modelId: 'grok-2-1212', modelName: 'Grok 2', description: 'Advanced reasoning and code generation', contextLength: 128000 },
      { modelId: 'grok-2-vision-1212', modelName: 'Grok 2 Vision', description: 'Multimodal vision and document parsing', contextLength: 32768 }
    ]
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    category: 'priority2',
    description: 'DeepSeek direct platform for V3 chat and R1 reasoning.',
    apiKeyHelpUrl: 'https://platform.deepseek.com/api_keys',
    placeholderKey: 'sk-...',
    defaultBaseUrl: 'https://api.deepseek.com',
    supportsModelDiscovery: true,
    defaultModels: [
      { modelId: 'deepseek-chat', modelName: 'DeepSeek-V3 Chat', description: 'Affordable, high capacity code & chat model', contextLength: 64000 },
      { modelId: 'deepseek-reasoner', modelName: 'DeepSeek-R1 Reasoner', description: 'Chain-of-thought mathematical & logical reasoning', contextLength: 64000 }
    ]
  },
  github: {
    id: 'github',
    name: 'GitHub Models',
    category: 'priority2',
    description: 'GitHub Marketplace models using GitHub Personal Access Token.',
    apiKeyHelpUrl: 'https://github.com/settings/tokens',
    placeholderKey: 'ghp_...',
    defaultBaseUrl: 'https://models.inference.ai.azure.com',
    supportsModelDiscovery: false,
    defaultModels: [
      { modelId: 'gpt-4o', modelName: 'GitHub GPT-4o', description: 'Azure-hosted OpenAI GPT-4o via GitHub', contextLength: 128000 },
      { modelId: 'Meta-Llama-3.1-70B-Instruct', modelName: 'GitHub Llama 3.1 70B', description: 'Azure-hosted Llama 3.1 70B', contextLength: 128000 }
    ]
  },
  custom: {
    id: 'custom',
    name: 'Custom OpenAI-Compatible Provider',
    category: 'priority3',
    description: 'Connect any OpenAI-compatible API (Ollama, vLLM, LMStudio, local inference, private server).',
    apiKeyHelpUrl: '',
    placeholderKey: 'sk-... or optional',
    defaultBaseUrl: 'http://localhost:11434/v1',
    supportsModelDiscovery: true,
    defaultModels: [
      { modelId: 'custom-model', modelName: 'My Custom Model', description: 'Self-hosted or proprietary API model' }
    ]
  }
};
