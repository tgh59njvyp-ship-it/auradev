import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  FileCode,
  FileText,
  FilePlus,
  Trash2,
  Play,
  Download,
  Share2,
  Wand2,
  Check,
  X,
  Eye,
  RefreshCw,
  Sparkles,
  GitBranch,
  Save,
  Lock,
  Zap,
  Code,
  Layers,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Project, ProjectFile, CustomModel, FileDiffProposal, ProviderId } from '../types';
import { exportProjectAsZip, computeLineDiff, LineDiff } from '../utils/export';

interface ProjectsPageProps {
  projects: Project[];
  activeProjectId?: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, description?: string) => Promise<Project>;
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onProposeEdit: (payload: {
    projectId: string;
    filePath: string;
    instruction: string;
    providerId: ProviderId;
    modelId: string;
  }) => Promise<FileDiffProposal>;
  models: CustomModel[];
  fixedModel?: CustomModel;
  isDemoMode: boolean;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onProposeEdit,
  models,
  fixedModel,
  isDemoMode
}) => {
  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [activeView, setActiveView] = useState<'editor' | 'preview' | 'diff'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New file creation
  const [newFilePath, setNewFilePath] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);

  // New project modal
  const [showNewProjModal, setShowNewProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  // AI Edit Assistant
  const [aiInstruction, setAiInstruction] = useState('');
  const [isProposing, setIsProposing] = useState(false);
  const [currentDiff, setCurrentDiff] = useState<FileDiffProposal | null>(null);
  const [lineDiffs, setLineDiffs] = useState<LineDiff[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    fixedModel ? fixedModel.id : models[0]?.id || ''
  );

  const activeModel = models.find(m => m.id === selectedModelId) || fixedModel || models[0];

  // Set active file when project changes
  useEffect(() => {
    if (currentProject && currentProject.files.length > 0) {
      const fileToOpen =
        currentProject.files.find(f => f.path === currentProject.activeFilePath) ||
        currentProject.files.find(f => f.path.endsWith('.html')) ||
        currentProject.files[0];
      setActiveFile(fileToOpen);
      setEditorContent(fileToOpen.content);
    } else {
      setActiveFile(null);
      setEditorContent('');
    }
    setCurrentDiff(null);
  }, [currentProject?.id]);

  const handleSelectFile = (file: ProjectFile) => {
    setActiveFile(file);
    setEditorContent(file.content);
    setCurrentDiff(null);
    if (activeView === 'diff') setActiveView('editor');
  };

  const handleSaveFile = async () => {
    if (!currentProject || !activeFile) return;
    setIsSaving(true);
    try {
      const updatedFiles = currentProject.files.map(f => {
        if (f.path === activeFile.path) {
          return { ...f, content: editorContent, updatedAt: new Date().toISOString() };
        }
        return f;
      });
      await onUpdateProject(currentProject.id, {
        files: updatedFiles,
        activeFilePath: activeFile.path
      });
      setActiveFile({ ...activeFile, content: editorContent });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !newFilePath.trim()) return;

    const path = newFilePath.trim();
    const ext = path.split('.').pop() || 'txt';
    const newFile: ProjectFile = {
      path,
      content: '',
      language: ext === 'ts' || ext === 'tsx' ? 'typescript' : ext === 'js' || ext === 'jsx' ? 'javascript' : ext,
      updatedAt: new Date().toISOString()
    };

    const updatedFiles = [...currentProject.files, newFile];
    await onUpdateProject(currentProject.id, { files: updatedFiles, activeFilePath: path });
    setNewFilePath('');
    setShowNewFileInput(false);
    setActiveFile(newFile);
    setEditorContent('');
  };

  const handleDeleteFile = async (pathToDelete: string) => {
    if (!currentProject || currentProject.files.length <= 1) {
      alert('Cannot delete the last file of the project');
      return;
    }
    const updatedFiles = currentProject.files.filter(f => f.path !== pathToDelete);
    await onUpdateProject(currentProject.id, {
      files: updatedFiles,
      activeFilePath: updatedFiles[0]?.path
    });
    if (activeFile?.path === pathToDelete) {
      setActiveFile(updatedFiles[0]);
      setEditorContent(updatedFiles[0].content);
    }
  };

  const handleProposeAiEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !activeFile || !aiInstruction.trim() || !activeModel) return;

    setIsProposing(true);
    try {
      const diff = await onProposeEdit({
        projectId: currentProject.id,
        filePath: activeFile.path,
        instruction: aiInstruction.trim(),
        providerId: activeModel.providerId,
        modelId: activeModel.modelId
      });
      setCurrentDiff(diff);
      const computed = computeLineDiff(diff.originalContent, diff.proposedContent);
      setLineDiffs(computed);
      setActiveView('diff');
      setAiInstruction('');
    } catch (err: any) {
      alert('AI edit failed: ' + err.message);
    } finally {
      setIsProposing(false);
    }
  };

  const handleApplyDiff = async () => {
    if (!currentProject || !activeFile || !currentDiff) return;

    const updatedFiles = currentProject.files.map(f => {
      if (f.path === activeFile.path) {
        return { ...f, content: currentDiff.proposedContent, updatedAt: new Date().toISOString() };
      }
      return f;
    });

    await onUpdateProject(currentProject.id, { files: updatedFiles });
    setEditorContent(currentDiff.proposedContent);
    setActiveFile({ ...activeFile, content: currentDiff.proposedContent });
    setCurrentDiff(null);
    setActiveView('editor');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleRejectDiff = () => {
    setCurrentDiff(null);
    setActiveView('editor');
  };

  const handleDownloadZip = () => {
    if (!currentProject) return;
    exportProjectAsZip(currentProject);
  };

  // Preview document source creation
  const getPreviewSource = () => {
    if (!currentProject) return '';
    const htmlFile = currentProject.files.find(f => f.path.endsWith('.html'));
    if (!htmlFile) {
      return `<html><body style="font-family:sans-serif;padding:2rem;background:#090d16;color:#e2e8f0;"><h2>No HTML entry point found</h2><p>Please create an index.html file to preview your app.</p></body></html>`;
    }

    let html = htmlFile.content;
    // Inject scripts or css if separated
    currentProject.files.forEach(f => {
      if (f.path.endsWith('.css') && !html.includes(f.path)) {
        html = html.replace('</head>', `<style>${f.content}</style></head>`);
      }
      if (f.path.endsWith('.js') && !html.includes(f.path)) {
        html = html.replace('</body>', `<script>${f.content}</script></body>`);
      }
    });

    return html;
  };

  return (
    <div className="flex h-[calc(100vh-4.2rem)] -m-4 md:-m-6 overflow-hidden bg-slate-950">
      {/* Pane 1: Left Project & File Tree */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Project Selector Bar */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projects</span>
            <button
              onClick={() => setShowNewProjModal(true)}
              className="p-1 text-indigo-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="New Project"
            >
              <FilePlus size={14} />
            </button>
          </div>

          <select
            value={currentProject?.id}
            onChange={e => onSelectProject(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Files Tree */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <FolderGit2 size={13} className="text-indigo-400" />
              <span>Workspace Files</span>
            </span>
            <button
              onClick={() => setShowNewFileInput(!showNewFileInput)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300"
              title="Add File"
            >
              + File
            </button>
          </div>

          {/* New file inline form */}
          {showNewFileInput && (
            <form onSubmit={handleCreateFile} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="filename.ext"
                value={newFilePath}
                onChange={e => setNewFilePath(e.target.value)}
                className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button type="submit" className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">
                Add
              </button>
            </form>
          )}

          <div className="space-y-1">
            {currentProject?.files.map(file => {
              const isSelected = file.path === activeFile?.path;
              return (
                <div
                  key={file.path}
                  onClick={() => handleSelectFile(file)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-600/20 text-white font-medium border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileCode
                      size={14}
                      className={isSelected ? 'text-indigo-400' : 'text-slate-500'}
                    />
                    <span className="font-mono text-[11px] truncate">{file.path}</span>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteFile(file.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition"
                    title="Delete file"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Actions Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2 text-xs">
          <button
            onClick={handleDownloadZip}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Download size={13} />
            <span>Download Project (ZIP)</span>
          </button>
        </div>
      </aside>

      {/* Pane 2: Center Editor / Diff / Preview */}
      <main className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* Editor Top Navigation Tabs */}
        <div className="h-12 border-b border-slate-800 bg-slate-900/80 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs text-white font-medium flex items-center gap-1.5">
              <FileCode size={14} className="text-indigo-400" />
              <span>{activeFile?.path || 'No file selected'}</span>
            </span>

            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveView('editor')}
                className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeView === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Code Editor
              </button>
              <button
                onClick={() => setActiveView('preview')}
                className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1 cursor-pointer ${
                  activeView === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Play size={11} />
                <span>Live Preview</span>
              </button>
              {currentDiff && (
                <button
                  onClick={() => setActiveView('diff')}
                  className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1 cursor-pointer ${
                    activeView === 'diff'
                      ? 'bg-amber-600 text-white'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Sparkles size={11} />
                  <span>Diff Review</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 animate-fade-in font-medium">
                <Check size={14} /> Saved
              </span>
            )}
            <button
              onClick={handleSaveFile}
              disabled={isSaving}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
            >
              <Save size={13} />
              <span>Save File</span>
            </button>
          </div>
        </div>

        {/* Main Editor Viewport */}
        <div className="flex-1 overflow-auto bg-slate-950 relative">
          {activeView === 'editor' && (
            <div className="flex min-h-full font-mono text-xs">
              {/* Line Numbers */}
              <div className="w-12 bg-slate-900/50 text-slate-400 text-right pr-3 pt-3 select-none border-r border-slate-800/80">
                {editorContent.split('\n').map((_, i) => (
                  <div key={i} className="leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea Code Editor */}
              <textarea
                value={editorContent}
                onChange={e => setEditorContent(e.target.value)}
                spellCheck={false}
                className="flex-1 p-3 bg-transparent text-slate-100 focus:outline-none resize-none leading-6 font-mono whitespace-pre"
              />
            </div>
          )}

          {/* Live Preview Viewport */}
          {activeView === 'preview' && (
            <div className="w-full h-full bg-white flex flex-col">
              <iframe
                title="Live Sandboxed Preview"
                srcDoc={getPreviewSource()}
                sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* Diff Viewer Viewport */}
          {activeView === 'diff' && currentDiff && (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm font-sans flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <span>Proposed Code Changes</span>
                  </h4>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">{currentDiff.summary}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRejectDiff}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-sans font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <X size={13} />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={handleApplyDiff}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-sans font-bold flex items-center gap-1 shadow-md cursor-pointer"
                  >
                    <Check size={13} />
                    <span>Apply Changes</span>
                  </button>
                </div>
              </div>

              {/* Line by line diff table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                {lineDiffs.map((diff, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start px-3 py-0.5 leading-6 ${
                      diff.type === 'added'
                        ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500'
                        : diff.type === 'removed'
                        ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 line-through'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="w-8 text-right text-slate-400 select-none pr-3 shrink-0">
                      {diff.lineNumberOld || ''}
                    </span>
                    <span className="w-8 text-right text-slate-400 select-none pr-3 shrink-0">
                      {diff.lineNumberNew || ''}
                    </span>
                    <span className="w-4 select-none shrink-0 font-bold">
                      {diff.type === 'added' ? '+' : diff.type === 'removed' ? '-' : ' '}
                    </span>
                    <span className="whitespace-pre overflow-x-auto flex-1">{diff.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Pane 3: Right AI Code Assistant & Quick Editing */}
      <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 p-4 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Wand2 size={16} className="text-indigo-400" />
          <h3 className="font-bold text-sm text-white">AI Code Editor</h3>
        </div>

        {/* Model Specifier for Editing */}
        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>MODEL</span>
            {activeModel?.isFixed && (
              <span className="text-amber-400 flex items-center gap-0.5 font-sans font-bold">
                <Lock size={10} /> FIXED
              </span>
            )}
          </div>
          <select
            value={selectedModelId}
            onChange={e => setSelectedModelId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 font-semibold focus:outline-none"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.modelName} ({m.modelId})
              </option>
            ))}
          </select>
        </div>

        {/* AI Instruction Form */}
        <form onSubmit={handleProposeAiEdit} className="space-y-3 flex-1 flex flex-col">
          <div className="flex-1 flex flex-col space-y-1">
            <label className="text-xs font-medium text-slate-300">
              このファイルへの指示 <span className="text-slate-400 text-[10px]">({activeFile?.path})</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="例: スマホ対応にして / バグを修正して / Material 3風のカードを追加して / アニメーション効果を実装して..."
              value={aiInstruction}
              onChange={e => setAiInstruction(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition flex-1"
            />
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold block">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'レスポンシブ・スマホ最適化',
                'ダークモード配色を強化',
                'エラーハンドリング追加',
                'UIをモダンに洗練'
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAiInstruction(preset)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] border border-slate-700"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isProposing || !aiInstruction.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            {isProposing ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Generating Diff...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Propose AI Edit (Diff)</span>
              </>
            )}
          </button>
        </form>
      </aside>

      {/* New Project Modal */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create New Project</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="My New App"
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="App description..."
                  value={newProjDesc}
                  onChange={e => setNewProjDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowNewProjModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newProjName.trim()) return;
                  await onCreateProject(newProjName.trim(), newProjDesc.trim());
                  setShowNewProjModal(false);
                  setNewProjName('');
                  setNewProjDesc('');
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
