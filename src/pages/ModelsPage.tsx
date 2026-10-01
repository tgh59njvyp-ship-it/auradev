import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  ExternalLink,
  Sliders,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { CustomModel, ProviderId } from '../types';
import { PROVIDERS_META } from '../constants/providers';

interface ModelsPageProps {
  models: CustomModel[];
  onSaveModel: (model: Partial<CustomModel>) => Promise<void>;
  onDeleteModel: (modelId: string) => Promise<void>;
  onSetFixedModel: (modelId: string) => Promise<void>;
  onTestModel: (payload: { providerId: ProviderId; modelId: string }) => Promise<{
    available: boolean;
    latencyMs: number;
    message?: string;
    errorType?: string;
  }>;
  onDiscoverModels: (providerId: ProviderId) => Promise<any[]>;
  onExportModels: () => Promise<void>;
  onImportModels: (models: any[]) => Promise<void>;
  onSelectModelForChat: (model: CustomModel) => void;
}

export const ModelsPage: React.FC<ModelsPageProps> = ({
  models,
  onSaveModel,
  onDeleteModel,
  onSetFixedModel,
  onTestModel,
  onDiscoverModels,
  onExportModels,
  onImportModels,
  onSelectModelForChat
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModel, setEditingModel] = useState<CustomModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [onlyFixed, setOnlyFixed] = useState(false);

  // Form State
  const [formProvider, setFormProvider] = useState<ProviderId>('gemini');
  const [formModelName, setFormModelName] = useState('');
  const [formModelId, setFormModelId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formContextLength, setFormContextLength] = useState<number | undefined>(128000);
  const [formInputPrice, setFormInputPrice] = useState<number | undefined>(undefined);
  const [formOutputPrice, setFormOutputPrice] = useState<number | undefined>(undefined);
  const [formCapabilities, setFormCapabilities] = useState({
    text: true,
    vision: false,
    image: false,
    audio: false,
    toolCalling: false,
    structuredOutput: false
  });
  const [formIsFixed, setFormIsFixed] = useState(false);

  // Test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ available: boolean; latencyMs?: number; message?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Discovery state
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredList, setDiscoveredList] = useState<any[]>([]);

  // Delete modal
  const [modelToDelete, setModelToDelete] = useState<CustomModel | null>(null);

  const resetForm = () => {
    setEditingModel(null);
    setFormProvider('gemini');
    setFormModelName('');
    setFormModelId('');
    setFormDescription('');
    setFormContextLength(128000);
    setFormInputPrice(undefined);
    setFormOutputPrice(undefined);
    setFormCapabilities({
      text: true,
      vision: false,
      image: false,
      audio: false,
      toolCalling: false,
      structuredOutput: false
    });
    setFormIsFixed(false);
    setTestResult(null);
    setDiscoveredList([]);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (model: CustomModel) => {
    setEditingModel(model);
    setFormProvider(model.providerId);
    setFormModelName(model.modelName);
    setFormModelId(model.modelId);
    setFormDescription(model.description || '');
    setFormContextLength(model.contextLength);
    setFormInputPrice(model.inputPrice);
    setFormOutputPrice(model.outputPrice);
    setFormCapabilities(model.capabilities || {
      text: true,
      vision: false,
      image: false,
      audio: false,
      toolCalling: false,
      structuredOutput: false
    });
    setFormIsFixed(model.isFixed);
    setTestResult(null);
    setShowAddModal(true);
  };

  const handleTestInForm = async () => {
    if (!formModelId.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestModel({
        providerId: formProvider,
        modelId: formModelId.trim()
      });
      setTestResult({
        available: res.available,
        latencyMs: res.latencyMs,
        message: res.available
          ? `✓ Model Available (${res.latencyMs}ms)`
          : `✕ Model Unavailable: ${res.message || 'API rejected model'}`
      });
    } catch (err: any) {
      setTestResult({
        available: false,
        message: '✕ Connection Failed: Could not reach provider'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formModelName.trim() || !formModelId.trim()) return;

    setIsSaving(true);
    try {
      await onSaveModel({
        id: editingModel?.id,
        providerId: formProvider,
        modelName: formModelName.trim(),
        modelId: formModelId.trim(),
        description: formDescription.trim(),
        contextLength: formContextLength ? Number(formContextLength) : undefined,
        inputPrice: formInputPrice !== undefined ? Number(formInputPrice) : undefined,
        outputPrice: formOutputPrice !== undefined ? Number(formOutputPrice) : undefined,
        capabilities: formCapabilities,
        isFixed: formIsFixed
      });
      setShowAddModal(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      const list = await onDiscoverModels(formProvider);
      setDiscoveredList(list);
    } catch {
      setDiscoveredList([]);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSelectDiscovered = (m: any) => {
    setFormModelId(m.modelId);
    if (!formModelName) {
      setFormModelName(m.modelName || m.modelId);
    }
    if (m.description && !formDescription) {
      setFormDescription(m.description);
    }
    if (m.contextLength) {
      setFormContextLength(m.contextLength);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        await onImportModels(parsed);
      } catch (err) {
        alert('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  };

  // Filtered models
  const filteredModels = models.filter(m => {
    if (onlyFixed && !m.isFixed) return false;
    if (providerFilter !== 'all' && m.providerId !== providerFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.modelName.toLowerCase().includes(q) ||
        m.modelId.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <Cpu size={16} />
              <span>Bring Your Own Model (BYOM)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Models Management
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              サービス側の決め打ちモデルに縛られず、ユーザー自身が自由な <strong className="text-white">Model Name</strong> と <strong className="text-cyan-400 font-mono">Model ID</strong> を組み合わせて登録できます。登録したモデルは「🔒 FIXED」設定で勝手に変更されないよう保護できます。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onExportModels}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
              title="Export models as JSON (Never includes API Keys)"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>

            <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer">
              <Upload size={14} />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Model</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Model Name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center space-x-1 text-xs text-slate-400 shrink-0">
            <Filter size={13} />
            <span>Provider:</span>
          </div>
          <select
            value={providerFilter}
            onChange={e => setProviderFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Providers</option>
            {Object.values(PROVIDERS_META).map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setOnlyFixed(!onlyFixed)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              onlyFixed
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Lock size={12} className={onlyFixed ? 'text-amber-400' : 'text-slate-400'} />
            <span>Fixed Only</span>
          </button>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map(model => {
          const providerMeta = PROVIDERS_META[model.providerId];
          return (
            <div
              key={model.id}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 shadow-lg transition flex flex-col justify-between ${
                model.isFixed
                  ? 'border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Provider & Badges */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {providerMeta?.name || model.providerId}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {model.isFixed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs">
                        <Lock size={10} /> FIXED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        CUSTOM
                      </span>
                    )}
                  </div>
                </div>

                {/* Model Name and Model ID */}
                <div>
                  <h3 className="font-bold text-base text-white truncate" title={model.modelName}>
                    {model.modelName}
                  </h3>
                  <div className="mt-1 flex items-center space-x-1.5 font-mono text-xs text-cyan-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400">ID:</span>
                    <span className="truncate" title={model.modelId}>
                      {model.modelId}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {model.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {model.description}
                  </p>
                )}

                {/* Specs / Capabilities */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {model.contextLength && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] text-slate-300 font-mono border border-slate-700">
                      {(model.contextLength / 1000).toFixed(0)}k ctx
                    </span>
                  )}
                  {model.capabilities?.vision && (
                    <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 text-[10px] border border-cyan-500/20">
                      Vision
                    </span>
                  )}
                  {model.capabilities?.toolCalling && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[10px] border border-purple-500/20">
                      Tools
                    </span>
                  )}
                  {model.capabilities?.structuredOutput && (
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px] border border-indigo-500/20">
                      JSON
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSelectModelForChat(model)}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    Use in Chat
                  </button>

                  {!model.isFixed ? (
                    <button
                      onClick={() => onSetFixedModel(model.id)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                      title="Set as Fixed Model (Locks this model for builds and chats)"
                    >
                      <Lock size={15} />
                    </button>
                  ) : (
                    <span className="p-1.5 text-amber-400" title="Fixed model active">
                      <Lock size={15} />
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(model)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="Edit Model"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setModelToDelete(model)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Delete Model"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Model Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu size={18} className="text-indigo-400" />
                {editingModel ? 'Edit Custom Model' : 'Add Model (BYOM)'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Provider Selection & Discovery */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Provider</label>
                  <button
                    type="button"
                    onClick={handleDiscover}
                    disabled={isDiscovering}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {isDiscovering ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    <span>APIからモデル一覧を取得</span>
                  </button>
                </div>
                <select
                  value={formProvider}
                  onChange={e => setFormProvider(e.target.value as ProviderId)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {Object.values(PROVIDERS_META).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Discovered models quick picker */}
              {discoveredList.length > 0 && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Discovered Models from API ({discoveredList.length}):
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {discoveredList.map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDiscovered(m)}
                        className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-xs flex items-center justify-between text-slate-300 font-mono"
                      >
                        <span className="truncate">{m.modelId}</span>
                        <span className="text-[10px] text-indigo-400 font-sans shrink-0 ml-2">Select</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Name & Model ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Model Name (UI表示用) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Coding Pro"
                    value={formModelName}
                    onChange={e => setFormModelName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">UI上で識別するための任意の名前</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Model ID (API送信生識別子) <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. provider/model-id"
                    value={formModelId}
                    onChange={e => setFormModelId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">APIへ送信される正確な識別子</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Specialized in TypeScript, Tailwind & full-stack synthesis"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Context Length & Pricing */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Context Length</label>
                  <input
                    type="number"
                    placeholder="128000"
                    value={formContextLength || ''}
                    onChange={e => setFormContextLength(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Input Price ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.15"
                    value={formInputPrice !== undefined ? formInputPrice : ''}
                    onChange={e => setFormInputPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Output Price ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.60"
                    value={formOutputPrice !== undefined ? formOutputPrice : ''}
                    onChange={e => setFormOutputPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Capabilities Checkboxes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Capabilities</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['text', 'vision', 'image', 'audio', 'toolCalling', 'structuredOutput'] as const).map(cap => (
                    <label
                      key={cap}
                      className="flex items-center space-x-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 cursor-pointer hover:border-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={formCapabilities[cap]}
                        onChange={e => setFormCapabilities({ ...formCapabilities, [cap]: e.target.checked })}
                        className="rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0"
                      />
                      <span className="capitalize">{cap === 'toolCalling' ? 'Tools' : cap === 'structuredOutput' ? 'JSON' : cap}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fixed Model checkbox */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock size={15} className="text-amber-400" />
                  <div>
                    <span className="text-xs font-semibold text-amber-300 block">Set as Fixed Model</span>
                    <span className="text-[10px] text-slate-400">
                      AIが勝手に別モデルに変更しないよう、プロジェクト生成やチャットの規定モデルとしてロックします。
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formIsFixed}
                  onChange={e => setFormIsFixed(e.target.checked)}
                  className="rounded text-amber-600 bg-slate-900 border-amber-500/50 w-4 h-4"
                />
              </div>

              {/* Test Model result box */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                    testResult.available
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  {testResult.available ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleTestInForm}
                  disabled={isTesting || !formModelId.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {isTesting ? <RefreshCw size={13} className="animate-spin text-cyan-400" /> : <Zap size={13} />}
                  <span>Test Model</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formModelName.trim() || !formModelId.trim()}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                    <span>Save Model</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {modelToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete this model?</h3>
            <p className="text-xs text-slate-300">
              モデル「{modelToDelete.modelName}」({modelToDelete.modelId}) を削除しますか？<br />
              <span className="text-slate-400 text-[11px]">※登録済みのProviderやAPI Keyは削除されません。</span>
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setModelToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteModel(modelToDelete.id);
                  setModelToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
