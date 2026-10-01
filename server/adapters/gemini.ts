import { GoogleGenAI } from '@google/genai';
import { AIProviderAdapter, AdapterValidationResult, AdapterModelInfo, AdapterModelTestResult, AdapterRequest, AdapterResponse } from './types.js';
import { classifyApiError } from '../security.js';

export class GeminiProviderAdapter implements AIProviderAdapter {
  id = 'gemini';
  name = 'Google Gemini';

  async validateApiKey(apiKey: string): Promise<AdapterValidationResult> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Hi'
      });
      if (response) {
        return { valid: true };
      }
      return { valid: false, message: 'No response received from Gemini' };
    } catch (err: any) {
      const classified = classifyApiError(err?.status || 500, err?.message || '');
      return {
        valid: false,
        errorType: classified.type === 'invalid_key' ? 'invalid_key' : 'unknown',
        message: classified.userMessage
      };
    }
  }

  async listModels(apiKey: string): Promise<AdapterModelInfo[]> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const pager = await ai.models.list();
      const models: AdapterModelInfo[] = [];
      for await (const m of pager) {
        const id = m.name?.replace('models/', '') || '';
        if (id.includes('gemini') || id.includes('embedding')) {
          models.push({
            modelId: id,
            modelName: m.displayName || id,
            description: m.description || '',
            contextLength: (m as any).inputTokenLimit || 1048576
          });
        }
      }
      return models;
    } catch {
      // Fallback to recommended Gemini models
      return [
        { modelId: 'gemini-2.5-flash', modelName: 'Gemini 2.5 Flash', description: 'Fast, multimodal model', contextLength: 1048576 },
        { modelId: 'gemini-2.5-pro', modelName: 'Gemini 2.5 Pro', description: 'Advanced reasoning & coding', contextLength: 2097152 },
        { modelId: 'gemini-1.5-pro', modelName: 'Gemini 1.5 Pro', description: 'Massive context coding', contextLength: 2097152 },
        { modelId: 'gemini-1.5-flash', modelName: 'Gemini 1.5 Flash', description: 'Lightweight & fast', contextLength: 1048576 }
      ];
    }
  }

  async testModel(apiKey: string, modelId: string): Promise<AdapterModelTestResult> {
    const start = Date.now();
    try {
      const ai = new GoogleGenAI({ apiKey });
      const resp = await ai.models.generateContent({
        model: modelId,
        contents: 'Hi'
      });
      const latency = Date.now() - start;
      if (resp && resp.text) {
        return { available: true, latencyMs: latency };
      }
      return { available: true, latencyMs: latency };
    } catch (err: any) {
      console.error('[TEST RAW ERROR]', err);
      const latency = Date.now() - start;
      const classified = classifyApiError(err?.status || 500, err?.message || '');
      return {
        available: false,
        latencyMs: latency,
        errorType: classified.type as any,
        message: classified.userMessage
      };
    }
  }

  async generateText(apiKey: string, request: AdapterRequest): Promise<AdapterResponse> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const contents = request.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const config: any = {};
      if (request.systemInstruction) {
        config.systemInstruction = request.systemInstruction;
      }
      if (request.temperature !== undefined) {
        config.temperature = request.temperature;
      }
      if (request.maxTokens !== undefined) {
        config.maxOutputTokens = request.maxTokens;
      }

      const response = await ai.models.generateContent({
        model: request.modelId,
        contents,
        config
      });

      const text = response.text || '';
      const usage = response.usageMetadata;
      return {
        content: text,
        inputTokens: usage?.promptTokenCount || 0,
        outputTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0
      };
    } catch (err: any) {
      const classified = classifyApiError(err?.status || 500, err?.message || '');
      throw new Error(classified.userMessage);
    }
  }

  async streamText(
    apiKey: string,
    request: AdapterRequest,
    onChunk: (text: string) => void
  ): Promise<AdapterResponse> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const contents = request.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const config: any = {};
      if (request.systemInstruction) {
        config.systemInstruction = request.systemInstruction;
      }
      if (request.temperature !== undefined) {
        config.temperature = request.temperature;
      }
      if (request.maxTokens !== undefined) {
        config.maxOutputTokens = request.maxTokens;
      }

      const stream = await ai.models.generateContentStream({
        model: request.modelId,
        contents,
        config
      });

      let fullText = '';
      let totalUsage: any = null;

      for await (const chunk of stream) {
        const chunkText = chunk.text || '';
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText);
        }
        if (chunk.usageMetadata) {
          totalUsage = chunk.usageMetadata;
        }
      }

      return {
        content: fullText,
        inputTokens: totalUsage?.promptTokenCount || Math.ceil(fullText.length / 4),
        outputTokens: totalUsage?.candidatesTokenCount || Math.ceil(fullText.length / 4),
        totalTokens: totalUsage?.totalTokenCount || Math.ceil(fullText.length / 2)
      };
    } catch (err: any) {
      const classified = classifyApiError(err?.status || 500, err?.message || '');
      throw new Error(classified.userMessage);
    }
  }
}
