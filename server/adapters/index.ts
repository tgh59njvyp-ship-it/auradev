import { AIProviderAdapter } from './types.js';
import { GeminiProviderAdapter } from './gemini.js';
import { AnthropicProviderAdapter } from './anthropic.js';
import { OpenAICompatibleAdapter } from './openai-compatible.js';

class ProviderRegistry {
  private adapters: Map<string, AIProviderAdapter> = new Map();

  constructor() {
    // 1. Google Gemini
    this.register(new GeminiProviderAdapter());

    // 2. OpenAI
    this.register(
      new OpenAICompatibleAdapter({
        id: 'openai',
        name: 'OpenAI',
        defaultBaseUrl: 'https://api.openai.com/v1',
        supportsModelList: true
      })
    );

    // 3. OpenRouter
    this.register(
      new OpenAICompatibleAdapter({
        id: 'openrouter',
        name: 'OpenRouter',
        defaultBaseUrl: 'https://openrouter.ai/api/v1',
        extraHeaders: {
          'HTTP-Referer': 'https://auradev.ai',
          'X-Title': 'AURA DEV'
        },
        supportsModelList: true
      })
    );

    // 4. Groq
    this.register(
      new OpenAICompatibleAdapter({
        id: 'groq',
        name: 'Groq',
        defaultBaseUrl: 'https://api.groq.com/openai/v1',
        supportsModelList: true
      })
    );

    // 5. Anthropic
    this.register(new AnthropicProviderAdapter());

    // 6. Mistral AI
    this.register(
      new OpenAICompatibleAdapter({
        id: 'mistral',
        name: 'Mistral AI',
        defaultBaseUrl: 'https://api.mistral.ai/v1',
        supportsModelList: true
      })
    );

    // 7. Cerebras
    this.register(
      new OpenAICompatibleAdapter({
        id: 'cerebras',
        name: 'Cerebras',
        defaultBaseUrl: 'https://api.cerebras.ai/v1',
        supportsModelList: true
      })
    );

    // 8. xAI (Grok)
    this.register(
      new OpenAICompatibleAdapter({
        id: 'xai',
        name: 'xAI (Grok)',
        defaultBaseUrl: 'https://api.x.ai/v1',
        supportsModelList: true
      })
    );

    // 9. DeepSeek
    this.register(
      new OpenAICompatibleAdapter({
        id: 'deepseek',
        name: 'DeepSeek',
        defaultBaseUrl: 'https://api.deepseek.com',
        supportsModelList: true
      })
    );

    // 10. GitHub Models
    this.register(
      new OpenAICompatibleAdapter({
        id: 'github',
        name: 'GitHub Models',
        defaultBaseUrl: 'https://models.inference.ai.azure.com',
        supportsModelList: false
      })
    );

    // 11. Custom OpenAI-compatible Provider
    this.register(
      new OpenAICompatibleAdapter({
        id: 'custom',
        name: 'Custom Provider',
        defaultBaseUrl: 'http://localhost:11434/v1',
        supportsModelList: true
      })
    );
  }

  register(adapter: AIProviderAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  getAdapter(providerId: string): AIProviderAdapter {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      // Default to custom OpenAI adapter if not found
      return this.adapters.get('custom')!;
    }
    return adapter;
  }

  hasAdapter(providerId: string): boolean {
    return this.adapters.has(providerId);
  }
}

export const providerRegistry = new ProviderRegistry();
export * from './types.js';
