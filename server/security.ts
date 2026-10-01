import crypto from 'crypto';

// Server-side secret for AES-256-GCM encryption of stored API keys
const SERVER_SECRET = process.env.AURA_SECRET_KEY || crypto.randomBytes(32).toString('hex');
const KEY_BUFFER = crypto.scryptSync(SERVER_SECRET, 'aura-dev-salt-2026', 32);

/**
 * Mask an API key so only first 3 and last 4 characters are visible.
 * Never leaks the actual secret to frontend.
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey) return '';
  const clean = apiKey.trim();
  if (clean.length <= 8) {
    return '••••••••';
  }
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start}••••••••${end}`;
}

/**
 * Encrypt API key using AES-256-GCM before storing in database/memory.
 */
export function encryptApiKey(plainKey: string): string {
  if (!plainKey) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  
  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt API key for server-side provider call. Never returned to frontend!
 */
export function decryptApiKey(encryptedData: string): string {
  if (!encryptedData) return '';
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return '';
    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // If decryption fails, do not expose keys or internals
    return '';
  }
}

/**
 * Scrub secrets, Bearer tokens, and sensitive patterns from log strings and error messages.
 */
export function sanitizeLog(text: string): string {
  if (!text) return '';
  let sanitized = text;
  // Match sk-..., AIzaSy..., gsk_..., ghp_..., xai-..., etc.
  sanitized = sanitized.replace(/(sk-[a-zA-Z0-9_\-]{16,})/gi, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(/(AIzaSy[a-zA-Z0-9_\-]{20,})/gi, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(/(gsk_[a-zA-Z0-9_\-]{20,})/gi, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(/(ghp_[a-zA-Z0-9_\-]{20,})/gi, '[REDACTED_TOKEN]');
  sanitized = sanitized.replace(/(Bearer\s+)[a-zA-Z0-9._\-]+/gi, '$1[REDACTED]');
  sanitized = sanitized.replace(/(xai-[a-zA-Z0-9_\-]{16,})/gi, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(/(csk-[a-zA-Z0-9_\-]{16,})/gi, '[REDACTED_API_KEY]');
  return sanitized;
}

/**
 * Classify common API errors safely without exposing user keys.
 */
export function classifyApiError(status: number, message: string): {
  type: 'invalid_key' | 'rate_limit' | 'model_not_found' | 'context_length' | 'provider_error' | 'network_error';
  userMessage: string;
} {
  const msgLower = (message || '').toLowerCase();
  
  if (status === 401 || status === 403 || msgLower.includes('api key') || msgLower.includes('unauthorized') || msgLower.includes('authentication')) {
    return {
      type: 'invalid_key',
      userMessage: 'Invalid API key or authentication failed. Please check your API key in Settings.'
    };
  }
  if (status === 429 || msgLower.includes('rate limit') || msgLower.includes('quota') || msgLower.includes('resource exhausted')) {
    return {
      type: 'rate_limit',
      userMessage: 'Rate limit or quota exceeded for this provider account. Please wait or check your provider quota.'
    };
  }
  if (status === 503 || msgLower.includes('high demand') || msgLower.includes('unavailable') || msgLower.includes('overloaded')) {
    return {
      type: 'provider_error',
      userMessage: 'This model is currently experiencing high demand or temporary unavailability on the provider. Please try again in a moment or select another model in Models.'
    };
  }
  if (status === 404 || msgLower.includes('model not found') || msgLower.includes('does not exist') || msgLower.includes('unknown model') || msgLower.includes('no longer available')) {
    return {
      type: 'model_not_found',
      userMessage: 'The requested Model ID was not found or is no longer available on this provider. Please verify the exact Model ID in Models.'
    };
  }
  if (msgLower.includes('context') || msgLower.includes('maximum context') || msgLower.includes('too many tokens')) {
    return {
      type: 'context_length',
      userMessage: 'Context length exceeded. Please reduce the prompt size or choose a model with larger context window.'
    };
  }
  return {
    type: 'provider_error',
    userMessage: 'Provider returned an error. Service may be temporarily unavailable.'
  };
}
