import React, { useState } from 'react';
import {
  Terminal,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  Layers,
  Code2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  RefreshCw,
  FolderGit2
} from 'lucide-react';
import { CustomModel, Project, ProviderId } from '../types';

interface BuildPageProps {
  onGenerateProject: (payload: {
    prompt: string;
    templateType: 'web' | 'react' | 'node' | 'static';
    providerId: ProviderId;
    modelId: string;
  }) => Promise<Project>;
  models: CustomModel[];
  fixedModel?: CustomModel;
  onOpenProject: (projectId: string) => void;
  isDemoMode: boolean;
}

export const BuildPage: React.FC<BuildPageProps> = ({
  onGenerateProject,
  models,
  fixedModel,
  onOpenProject,
  isDemoMode
}) => {
  const [prompt, setPrompt] = useState('');
  const [templateType, setTemplateType] = useState<'web' | 'react' | 'node' | 'static'>('web');
  const [selectedModelId, setSelectedModelId] = useState<string>(
    fixedModel ? fixedModel.id : models[0]?.id || ''
  );
  const [isBuilding, setIsBuilding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<Project | null>(null);

  const activeModel = models.find(m => m.id === selectedModelId) || fixedModel || models[0];

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isBuilding) return;
    if (!activeModel) {
      alert('Please add an AI model first');
      return;
    }

    setIsBuilding(true);
    setErrorMsg(null);
    setCreatedProject(null);

    try {
      const proj = await onGenerateProject({
        prompt: prompt.trim(),
        templateType,
        providerId: activeModel.providerId,
        modelId: activeModel.modelId
      });
      setCreatedProject(proj);
    } catch (err: any) {
      setErrorMsg(err.message || 'Build generation failed');
    } finally {
      setIsBuilding(false);
    }
  };

  const samplePrompts = [
    {
      title: 'ポケモンカード管理コレクション',
      desc: 'カード検索、レアリティ別フィルタ、お気に入り登録、統計ダッシュボード',
      prompt: 'ポケモンカード管理コレクションサイトを作って。検索バー、属性・レア度フィルター、デッキ構築シミュレーター、所持リスト管理機能つきの美しいダークモードWebアプリ。'
    },
    {
      title: 'スマホ対応タイピングゲーム',
      desc: 'WPM計測、難易度選択、ミス判定、ハイスコア保存付き',
      prompt: 'スマホでもキーボードでも遊べるタイピングゲームWebアプリを作って。WPM計測、正確度、難易度（初級・中級・上級）選択、ローカルストレージへのスコアランキング保存機能つき。'
    },
    {
      title: 'Material 3 タスク & プロジェクト管理',
      desc: 'カンバンボード、進捗グラフ、タグ分類、ドラッグ＆ドロップ',
      prompt: 'Material 3 Expressiveデザインのタスク管理アプリを作って。未着手・進行中・完了のカンバンボード、タスク追加モーダル、タグ色分け、アニメーション付き。'
    },
    {
      title: '暗号資産 & 為替レートコンバーター',
      desc: 'リアルタイムレート計算、通貨比較グラフ、お気に入り一覧',
      prompt: '暗号資産（BTC, ETH, SOLなど）と主要法定通貨のリアルタイム為替レート計算ツールを作って。通貨選択、即時換算、インタラクティブチャート付き。'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Terminal size={16} />
            <span>Autonomous Full-Stack Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Build Mode
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            自然言語のアイデアから、プロダクション品質の完全なWebアプリケーション一式（HTML, CSS, JavaScript/TypeScript, 設定ファイル）を一度に生成します。
          </p>
        </div>
      </div>

      {/* Build Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <form onSubmit={handleBuild} className="space-y-5">
          {/* Active Model Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Generation Model:</span>
              <select
                value={selectedModelId}
                onChange={e => setSelectedModelId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.isFixed ? '🔒 ' : ''}{m.modelName} ({m.modelId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              {activeModel?.isFixed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Lock size={11} /> FIXED MODEL LOCKED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  <Zap size={11} /> Selected Model
                </span>
              )}
            </div>
          </div>

          {/* Prompt Textarea */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              どんなWebアプリ・サイトを作りますか？ <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="例: ポケモンカード管理サイトを作って。検索バー、属性・レア度フィルター、デッキ構築シミュレーター、所持リスト管理機能つき..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition"
            />
          </div>

          {/* Template Type */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Architecture Template</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'web', label: 'Interactive Web', desc: 'Single-page HTML5 + Tailwind CSS + Vanilla JS' },
                { id: 'react', label: 'React SPA', desc: 'Modern component-based application' },
                { id: 'node', label: 'Node.js Fullstack', desc: 'Express backend + frontend package' },
                { id: 'static', label: 'Static Portfolio', desc: 'Clean, fast HTML/CSS landing page' }
              ].map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => setTemplateType(tpl.id as any)}
                  className={`p-3 rounded-xl border cursor-pointer transition text-xs space-y-1 ${
                    templateType === tpl.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200">{tpl.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{tpl.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              ※AIが既存ファイルを推論し、即座に動くサンドボックスコード一式を生成します
            </span>

            <button
              type="submit"
              disabled={isBuilding || !prompt.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isBuilding ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Synthesizing Architecture...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generate Full Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Banner if Generated */}
      {createdProject && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Project Successfully Generated!</h3>
                <p className="text-xs text-slate-300">
                  「{createdProject.name}」({createdProject.files.length} files synthesized)
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenProject(createdProject.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-md cursor-pointer"
            >
              <span>Open in Code Editor</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20">
            {createdProject.files.map((file, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs flex items-center space-x-2 text-slate-300 font-mono"
              >
                <FileCode size={14} className="text-indigo-400 shrink-0" />
                <span className="truncate">{file.path}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Prompts Inspiration */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" />
          <span>Quick Inspiration Prompts</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {samplePrompts.map((s, idx) => (
            <div
              key={idx}
              onClick={() => setPrompt(s.prompt)}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition cursor-pointer space-y-2 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition">
                  {s.title}
                </h3>
                <ArrowRight size={14} className="text-slate-500 group-hover:text-indigo-400 transition" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
