export interface AdapterValidationResult {
  valid: boolean;
  message?: string;
  errorType?: 'invalid_key' | 'rate_limit' | 'network_error' | 'permission_denied' | 'unknown';
}

export interface AdapterModelInfo {
  modelId: string;
  modelName: string;
  description?: string;
  contextLength?: number;
}

export interface AdapterModelTestResult {
  available: boolean;
  latencyMs: number;
  message?: string;
  errorType?: 'invalid_model' | 'invalid_key' | 'rate_limit' | 'network_error' | 'permission_denied' | 'provider_error';
}

export interface AdapterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AdapterRequest {
  modelId: string;
  messages: AdapterMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AdapterResponse {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  finishReason?: string;
}

export interface AIProviderAdapter {
  id: string;
  name: string;
  validateApiKey(apiKey: string, customBaseUrl?: string): Promise<AdapterValidationResult>;
  listModels?(apiKey: string, customBaseUrl?: string): Promise<AdapterModelInfo[]>;
  testModel(apiKey: string, modelId: string, customBaseUrl?: string): Promise<AdapterModelTestResult>;
  generateText(apiKey: string, request: AdapterRequest, customBaseUrl?: string): Promise<AdapterResponse>;
  streamText(
    apiKey: string,
    request: AdapterRequest,
    onChunk: (text: string) => void,
    customBaseUrl?: string
  ): Promise<AdapterResponse>;
}
