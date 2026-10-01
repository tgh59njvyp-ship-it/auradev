import {
  AIProviderAdapter,
  AdapterValidationResult,
  AdapterModelInfo,
  AdapterModelTestResult,
  AdapterRequest,
  AdapterResponse
} from './types.js';
import { classifyApiError } from '../security.js';

export class AnthropicProviderAdapter implements AIProviderAdapter {
  id = 'anthropic';
  name = 'Anthropic';
  private baseUrl = 'https://api.anthropic.com/v1';

  private getHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01'
    };
  }

  async validateApiKey(apiKey: string): Promise<AdapterValidationResult> {
    try {
      const resp = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.getHeaders(apiKey),
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          messages: [{ role: 'user', content: 'Hi' }],
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
        message: 'Network connection failed while reaching Anthropic API.'
      };
    }
  }

  async listModels(): Promise<AdapterModelInfo[]> {
    return [
      { modelId: 'claude-3-7-sonnet-20250219', modelName: 'Claude 3.7 Sonnet', description: 'Hybrid reasoning and high performance coding', contextLength: 200000 },
      { modelId: 'claude-3-5-sonnet-20241022', modelName: 'Claude 3.5 Sonnet v2', description: 'Industry benchmark for software engineering', contextLength: 200000 },
      { modelId: 'claude-3-5-haiku-20241022', modelName: 'Claude 3.5 Haiku', description: 'Fast, responsive intelligence', contextLength: 200000 }
    ];
  }

  async testModel(apiKey: string, modelId: string): Promise<AdapterModelTestResult> {
    const start = Date.now();
    try {
      const resp = await fetch(`${this.baseUrl}/messages`, {
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
        message: 'Network connection failed during Anthropic model test.'
      };
    }
  }

  async generateText(apiKey: string, request: AdapterRequest): Promise<AdapterResponse> {
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const payload: any = {
      model: request.modelId,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7
    };
    if (request.systemInstruction) {
      payload.system = request.systemInstruction;
    }

    const resp = await fetch(`${this.baseUrl}/messages`, {
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
    const content = data.content?.[0]?.text || '';
    const usage = data.usage;

    return {
      content,
      inputTokens: usage?.input_tokens || 0,
      outputTokens: usage?.output_tokens || 0,
      totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0)
    };
  }

  async streamText(
    apiKey: string,
    request: AdapterRequest,
    onChunk: (text: string) => void
  ): Promise<AdapterResponse> {
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const payload: any = {
      model: request.modelId,
      messages,
      max_tokens: request.maxTokens || 4096,
      stream: true,
      temperature: request.temperature ?? 0.7
    };
    if (request.systemInstruction) {
      payload.system = request.systemInstruction;
    }

    const resp = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      const classified = classifyApiError(resp.status, errText);
      throw new Error(classified.userMessage);
    }

    if (!resp.body) throw new Error('Response body is null');

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
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              const delta = data.delta.text;
              fullText += delta;
              onChunk(delta);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    return {
      content: fullText,
      inputTokens: Math.ceil(request.messages.map(m => m.content).join(' ').length / 4),
      outputTokens: Math.ceil(fullText.length / 4),
      totalTokens: Math.ceil((request.messages.map(m => m.content).join(' ').length + fullText.length) / 4)
    };
  }
}
