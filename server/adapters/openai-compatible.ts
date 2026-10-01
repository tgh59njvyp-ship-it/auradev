import {
  AIProviderAdapter,
  AdapterValidationResult,
  AdapterModelInfo,
  AdapterModelTestResult,
  AdapterRequest,
  AdapterResponse
} from './types.js';
import { classifyApiError } from '../security.js';

export interface OpenAICompatibleConfig {
  id: string;
  name: string;
  defaultBaseUrl: string;
  extraHeaders?: Record<string, string>;
  modelIdPrefix?: string;
  supportsModelList?: boolean;
}

export class OpenAICompatibleAdapter implements AIProviderAdapter {
  id: string;
  name: string;
  protected defaultBaseUrl: string;
  protected extraHeaders: Record<string, string>;
  protected supportsModelList: boolean;

  constructor(config: OpenAICompatibleConfig) {
    this.id = config.id;
    this.name = config.name;
    this.defaultBaseUrl = config.defaultBaseUrl;
    this.extraHeaders = config.extraHeaders || {};
    this.supportsModelList = config.supportsModelList ?? true;
  }

  protected getBaseUrl(customBaseUrl?: string): string {
    let url = (customBaseUrl || this.defaultBaseUrl).trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  }

  protected getHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
      ...this.extraHeaders
    };
  }

  async validateApiKey(apiKey: string, customBaseUrl?: string): Promise<AdapterValidationResult> {
    try {
      const baseUrl = this.getBaseUrl(customBaseUrl);
      // Try /models first if supported
      if (this.supportsModelList) {
        const resp = await fetch(`${baseUrl}/models`, {
          method: 'GET',
          headers: this.getHeaders(apiKey)
        });
        if (resp.ok) {
          return { valid: true };
        }
        if (resp.status === 401 || resp.status === 403) {
          return { valid: false, errorType: 'invalid_key', message: 'API key is invalid or unauthorized.' };
        }
      }

      // If /models not supported or returns 404/405, test with minimal chat completion
      const testModelId = this.id === 'openrouter' ? 'meta-llama/llama-3.1-8b-instruct' :
                          this.id === 'groq' ? 'llama-3.1-8b-instant' :
                          this.id === 'deepseek' ? 'deepseek-chat' :
                          this.id === 'cerebras' ? 'llama3.1-8b' :
                          this.id === 'mistral' ? 'codestral-latest' :
                          this.id === 'xai' ? 'grok-2-1212' :
                          this.id === 'github' ? 'gpt-4o' : 'gpt-4o-mini';

      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(apiKey),
        body: JSON.stringify({
          model: testModelId,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1
        })
      });

      if (resp.ok) {
        return { valid: true };
      }

      const status = resp.status;
      const text = await resp.text();
      const classified = classifyApiError(status, text);
      return {
        valid: false,
        errorType: classified.type === 'invalid_key' ? 'invalid_key' : 'unknown',
        message: classified.userMessage
      };
    } catch (err: any) {
      return {
        valid: false,
        errorType: 'network_error',
        message: 'Could not connect to provider endpoint. Please check your network or custom Base URL.'
      };
    }
  }

  async listModels(apiKey: string, customBaseUrl?: string): Promise<AdapterModelInfo[]> {
    if (!this.supportsModelList) return [];
    try {
      const baseUrl = this.getBaseUrl(customBaseUrl);
      const resp = await fetch(`${baseUrl}/models`, {
        headers: this.getHeaders(apiKey)
      });
      if (!resp.ok) return [];
      const json: any = await resp.json();
      const rawList = Array.isArray(json) ? json : json.data || [];
      return rawList.map((m: any) => ({
        modelId: m.id || m.name,
        modelName: m.name || m.id,
        description: m.description || '',
        contextLength: m.context_length || m.context_window || 128000
      }));
    } catch {
      return [];
    }
  }

  async testModel(apiKey: string, modelId: string, customBaseUrl?: string): Promise<AdapterModelTestResult> {
    const start = Date.now();
    try {
      const baseUrl = this.getBaseUrl(customBaseUrl);
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(apiKey),
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 2
        })
      });

      const latency = Date.now() - start;
      if (resp.ok) {
        return { available: true, latencyMs: latency };
      }

      const text = await resp.text();
      const classified = classifyApiError(resp.status, text);
      return {
        available: false,
        latencyMs: latency,
        errorType: classified.type as any,
        message: classified.userMessage
      };
    } catch (err: any) {
      return {
        available: false,
        latencyMs: Date.now() - start,
        errorType: 'network_error',
        message: 'Network connection failed during model test.'
      };
    }
  }

  async generateText(apiKey: string, request: AdapterRequest, customBaseUrl?: string): Promise<AdapterResponse> {
    const baseUrl = this.getBaseUrl(customBaseUrl);
    const messages = [...request.messages];
    if (request.systemInstruction) {
      messages.unshift({ role: 'system', content: request.systemInstruction });
    }

    const payload: any = {
      model: request.modelId,
      messages,
      temperature: request.temperature ?? 0.7
    };
    if (request.maxTokens) {
      payload.max_tokens = request.maxTokens;
    }

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      const classified = classifyApiError(resp.status, errText);
      throw new Error(classified.userMessage);
    }

    const data: any = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage;

    return {
      content,
      inputTokens: usage?.prompt_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
      finishReason: data.choices?.[0]?.finish_reason
    };
  }

  async streamText(
    apiKey: string,
    request: AdapterRequest,
    onChunk: (text: string) => void,
    customBaseUrl?: string
  ): Promise<AdapterResponse> {
    const baseUrl = this.getBaseUrl(customBaseUrl);
    const messages = [...request.messages];
    if (request.systemInstruction) {
      messages.unshift({ role: 'system', content: request.systemInstruction });
    }

    const payload: any = {
      model: request.modelId,
      messages,
      stream: true,
      temperature: request.temperature ?? 0.7
    };
    if (request.maxTokens) {
      payload.max_tokens = request.maxTokens;
    }

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      const classified = classifyApiError(resp.status, errText);
      throw new Error(classified.userMessage);
    }

    if (!resp.body) {
      throw new Error('Response body is null');
    }

    let fullText = '';
    const reader = resp.body.getReader();
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
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              onChunk(delta);
            }
          } catch {
            // Ignore partial SSE framing
          }
        }
      }
    }

    return {
      content: fullText,
      inputTokens: Math.ceil((request.systemInstruction || '').length / 4) + Math.ceil(request.messages.map(m => m.content).join(' ').length / 4),
      outputTokens: Math.ceil(fullText.length / 4),
      totalTokens: Math.ceil((request.messages.map(m => m.content).join(' ').length + fullText.length) / 4)
    };
  }
}
