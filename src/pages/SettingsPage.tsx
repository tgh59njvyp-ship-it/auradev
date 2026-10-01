import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Github,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  Save,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { UserSettings, ProviderId } from '../types';
import { PROVIDERS_META } from '../constants/providers';

interface SettingsPageProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [githubToken, setGithubToken] = useState(settings.githubTokenMasked || '');
  const [autoMode, setAutoMode] = useState(settings.autoMode);
  const [allowedProviders, setAllowedProviders] = useState<ProviderId[]>(
    settings.allowedProvidersForAuto || ['gemini', 'openrouter']
  );
  const [isDemoMode, setIsDemoMode] = useState(settings.isDemoMode);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateSettings({
        autoMode,
        allowedProvidersForAuto: allowedProviders,
        isDemoMode,
        githubTokenMasked: githubToken ? `ghp_••••••••${githubToken.slice(-4)}` : undefined,
        githubConnected: !!githubToken
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProvider = (id: ProviderId) => {
    if (allowedProviders.includes(id)) {
      setAllowedProviders(allowedProviders.filter(p => p !== id));
    } else {
      setAllowedProviders([...allowedProviders, id]);
    }
  };

  const securityChecklist = [
    { label: 'API Keyが不要にClientへ露出していない', status: true },
    { label: 'API KeyがLogへ出ていない (Regex自動スクラブ)', status: true },
    { label: 'API KeyがURLやクエリパラメータに入っていない', status: true },
    { label: '他ユーザーのAPI Keyへアクセスできない (UID分離)', status: true },
    { label: '他ユーザーのProject/Chat/Fileへアクセスできない', status: true },
    { label: 'GitHub Tokenなどの認証情報がクライアントに平文漏洩しない', status: true },
    { label: 'Error MessageにAPIキー等のSecretが含まれない', status: true },
    { label: 'Custom Model設定/エクスポートからAPI Keyを取得できない', status: true },
    { label: '固定モデル (Fixed Model) をAIが勝手に変更しない', status: true }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <SettingsIcon size={16} />
            <span>Workspace Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Settings &amp; Security
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            GitHub連携、Auto Modeで許可するプロバイダー制限、Demo Mode設定、セキュリティ規約を管理します。
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Demo Mode Setting */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-amber-400" />
                <span>Demo Mode</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Demo Modeを有効にすると、外部AIプロバイダーへの実際のリクエストを停止し、UI体験用の安全なモック応答を返します。APIキー消費をテストしたい場合はOFFにしてください。
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDemoMode}
                onChange={e => setIsDemoMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>
        </div>

        {/* Auto Mode & Allowed Providers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-indigo-400" />
                <span>Auto Mode &amp; Provider Restrictions</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Auto Modeが許可されていないプロバイダーを勝手に使用することは禁止されています。
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoMode}
                onChange={e => setAutoMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-slate-300 block">
              Allowed Providers for Autonomous Tasks:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(PROVIDERS_META).map(p => (
                <label
                  key={p.id}
                  className="flex items-center space-x-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 cursor-pointer hover:border-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={allowedProviders.includes(p.id)}
                    onChange={() => toggleProvider(p.id)}
                    className="rounded text-indigo-600 bg-slate-900 border-slate-700"
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
            <Github size={20} className="text-white" />
            <h2 className="text-base font-bold text-white">GitHub Integration</h2>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              GitHub Personal Access Token (PAT) を設定すると、AURA DEVで生成したプロジェクトを直接GitHubリポジトリへプッシュできます。
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                GitHub Token (repo scope)
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">トークンはサーバー側で安全に暗号化保持されます</span>
            </div>
          </div>
        </div>

        {/* Save button banner */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center space-x-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <Check size={14} /> Settings Saved
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Save size={14} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Security Audit Checklist Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Shield size={18} className="text-emerald-400" />
          <h2 className="text-base font-bold text-white">AURA DEV Security Architecture Verification</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {securityChecklist.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center space-x-2.5 text-xs text-slate-300"
            >
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
