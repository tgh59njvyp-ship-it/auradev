import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Server,
  Lock,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { ProviderId, UserProviderKey } from '../types';
import { PROVIDERS_META } from '../constants/providers';

interface ApiKeysPageProps {
  keys: UserProviderKey[];
  onSaveKey: (payload: {
    providerId: ProviderId;
    apiKey: string;
    customBaseUrl?: string;
    customProviderName?: string;
    testImmediately?: boolean;
  }) => Promise<void>;
  onTestKey: (payload: {
    providerId: ProviderId;
    tempApiKey?: string;
    customBaseUrl?: string;
  }) => Promise<{ success: boolean; status: 'connected' | 'error'; message: string }>;
  onRemoveKey: (providerId: ProviderId) => Promise<void>;
}

export const ApiKeysPage: React.FC<ApiKeysPageProps> = ({
  keys,
  onSaveKey,
  onTestKey,
  onRemoveKey
}) => {
  const [inputKeys, setInputKeys] = useState<Record<string, string>>({});
  const [customUrls, setCustomUrls] = useState<Record<string, string>>({
    custom: 'http://localhost:11434/v1'
  });
  const [customNames, setCustomNames] = useState<Record<string, string>>({
    custom: 'My Local AI'
  });
  const [showPlain, setShowPlain] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const getKeyForProvider = (providerId: string) => {
    return keys.find(k => k.providerId === providerId);
  };

  const handleTestKey = async (providerId: ProviderId) => {
    setTestingId(providerId);
    setTestResults(prev => ({ ...prev, [providerId]: undefined as any }));

    const tempKey = inputKeys[providerId];
    const baseUrl = customUrls[providerId];

    try {
      const res = await onTestKey({
        providerId,
        tempApiKey: tempKey || undefined,
        customBaseUrl: baseUrl
      });
      setTestResults(prev => ({
        ...prev,
        [providerId]: { success: res.success, message: res.message }
      }));
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: { success: false, message: '✕ Connection Failed: Network error or invalid credentials' }
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleConnect = async (providerId: ProviderId) => {
    const rawKey = inputKeys[providerId];
    if (!rawKey || !rawKey.trim()) return;

    setSavingId(providerId);
    try {
      await onSaveKey({
        providerId,
        apiKey: rawKey.trim(),
        customBaseUrl: customUrls[providerId],
        customProviderName: customNames[providerId],
        testImmediately: true
      });
      // Clear plain input after saving to avoid lingering in memory
      setInputKeys(prev => ({ ...prev, [providerId]: '' }));
    } finally {
      setSavingId(null);
    }
  };

  const priority1Providers = Object.values(PROVIDERS_META).filter(p => p.category === 'priority1');
  const priority2Providers = Object.values(PROVIDERS_META).filter(p => p.category === 'priority2');
  const priority3Providers = Object.values(PROVIDERS_META).filter(p => p.category === 'priority3');

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <ShieldCheck size={16} />
              <span>Bring Your Own Key (BYOK) Security Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              API Keys Management
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              ユーザー自身のAPIキーを登録し、お好みのプロバイダーと接続します。AURA DEVが利用料金を負担・転嫁することはありません。キーはAES-256で安全に暗号化され、フロントエンドやログへ漏洩しません。
            </p>
          </div>
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1.5 shrink-0">
            <div className="flex items-center gap-2 text-slate-300">
              <Lock size={13} className="text-emerald-400" />
              <span>Zero-Log Transmission</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck size={13} className="text-indigo-400" />
              <span>Encrypted at Rest</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Key size={13} className="text-amber-400" />
              <span>Always Masked in UI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Priority 1 Providers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Priority 1 AI Providers
            </h2>
            <p className="text-xs text-slate-400">Industry leading frontier models &amp; high speed reasoning</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">4 Providers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {priority1Providers.map(provider => renderProviderCard(provider))}
        </div>
      </section>

      {/* Priority 2 Providers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              Priority 2 Specialized AI Providers
            </h2>
            <p className="text-xs text-slate-400">Anthropic Claude, DeepSeek, Mistral, Wafer-scale Cerebras &amp; Grok</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">6 Providers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {priority2Providers.map(provider => renderProviderCard(provider))}
        </div>
      </section>

      {/* Priority 3 Custom Provider */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              Custom OpenAI-Compatible Provider
            </h2>
            <p className="text-xs text-slate-400">Ollama, vLLM, LMStudio, Local Inference or Private API Endpoints</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Any Endpoint</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {priority3Providers.map(provider => renderCustomProviderCard(provider))}
        </div>
      </section>
    </div>
  );

  function renderProviderCard(provider: typeof PROVIDERS_META[keyof typeof PROVIDERS_META]) {
    const keyInfo = getKeyForProvider(provider.id);
    const isConnected = keyInfo?.status === 'connected';
    const isError = keyInfo?.status === 'error';
    const isTesting = testingId === provider.id;
    const isSaving = savingId === provider.id;
    const testResult = testResults[provider.id];
    const inputValue = inputKeys[provider.id] || '';
    const isPlainVisible = showPlain[provider.id];

    return (
      <div
        key={provider.id}
        className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition shadow-lg ${
          isConnected
            ? 'border-emerald-500/40 bg-slate-900/90'
            : isError
            ? 'border-rose-500/40 bg-slate-900/90'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Top: Name & Status */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base text-white">{provider.name}</h3>
              {provider.apiKeyHelpUrl && (
                <a
                  href={provider.apiKeyHelpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-indigo-400 transition"
                  title="Get API Key"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pr-2">{provider.description}</p>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Connected
              </span>
            ) : isError ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <AlertCircle size={12} />
                Connection Error
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Not Connected
              </span>
            )}
          </div>
        </div>

        {/* Existing Masked Key view if connected */}
        {keyInfo && keyInfo.maskedKey && (
          <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-mono text-slate-300">
              <Lock size={12} className="text-emerald-400 shrink-0" />
              <span className="truncate">{keyInfo.maskedKey}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0">Encrypted</span>
          </div>
        )}

        {/* Input Form */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-400">
            {keyInfo?.maskedKey ? 'Update API Key' : 'Enter API Key'}
          </label>
          <div className="relative">
            <input
              type={isPlainVisible ? 'text' : 'password'}
              placeholder={provider.placeholderKey || 'Paste your secret API key...'}
              value={inputValue}
              onChange={e => setInputKeys({ ...inputKeys, [provider.id]: e.target.value })}
              className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition"
            />
            <button
              type="button"
              onClick={() => setShowPlain({ ...showPlain, [provider.id]: !isPlainVisible })}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 transition"
              title={isPlainVisible ? 'マスクする' : '表示する'}
            >
              {isPlainVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 ${
              testResult.success
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}
          >
            {testResult.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            <span className="truncate">{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleConnect(provider.id as ProviderId)}
              disabled={isSaving || !inputValue.trim()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
              <span>{keyInfo?.maskedKey ? 'Update & Connect' : 'Connect'}</span>
            </button>

            <button
              onClick={() => handleTestKey(provider.id as ProviderId)}
              disabled={isTesting || (!inputValue.trim() && !keyInfo?.maskedKey)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
            >
              {isTesting ? <RefreshCw size={12} className="animate-spin text-cyan-400" /> : <RefreshCw size={12} />}
              <span>Connection Test</span>
            </button>
          </div>

          {keyInfo?.maskedKey && (
            <button
              onClick={() => onRemoveKey(provider.id as ProviderId)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Remove Key"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderCustomProviderCard(provider: typeof PROVIDERS_META[keyof typeof PROVIDERS_META]) {
    const keyInfo = getKeyForProvider('custom');
    const isConnected = keyInfo?.status === 'connected';
    const isTesting = testingId === 'custom';
    const isSaving = savingId === 'custom';
    const testResult = testResults['custom'];
    const inputValue = inputKeys['custom'] || '';

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Server size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Custom OpenAI-Compatible Provider</h3>
              <p className="text-xs text-slate-400">Connect private LLM servers, Ollama, LM Studio, or custom gateways</p>
            </div>
          </div>
          <div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                Not Connected
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Provider Name</label>
            <input
              type="text"
              placeholder="e.g. My Local Ollama"
              value={customNames['custom'] || ''}
              onChange={e => setCustomNames({ ...customNames, custom: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Base URL</label>
            <input
              type="text"
              placeholder="http://localhost:11434/v1"
              value={customUrls['custom'] || ''}
              onChange={e => setCustomUrls({ ...customUrls, custom: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">API Key (Optional for Local)</label>
            <input
              type="password"
              placeholder="sk-... or blank if unauthenticated"
              value={inputValue}
              onChange={e => setInputKeys({ ...inputKeys, custom: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              testResult.success
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}
          >
            {testResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleConnect('custom')}
              disabled={isSaving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-2 shadow-md cursor-pointer"
            >
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Server size={14} />}
              <span>Save &amp; Connect Custom Provider</span>
            </button>
            <button
              onClick={() => handleTestKey('custom')}
              disabled={isTesting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition flex items-center space-x-2 cursor-pointer"
            >
              {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Test Connection</span>
            </button>
          </div>

          {keyInfo && (
            <button
              onClick={() => onRemoveKey('custom')}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg transition"
              title="Remove"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }
};
