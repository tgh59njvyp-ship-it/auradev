import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Square,
  Paperclip,
  Code2,
  Copy,
  Check,
  Download,
  FolderPlus,
  Lock,
  Zap,
  Bot,
  User,
  Plus,
  Search,
  Trash2,
  ChevronDown,
  AlertCircle,
  FileText
} from 'lucide-react';
import { ChatSession, ChatMessage, CustomModel, ProviderId, Project } from '../types';
import { PROVIDERS_META } from '../constants/providers';

interface ChatPageProps {
  chats: ChatSession[];
  currentChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => Promise<void>;
  onSendMessage: (payload: {
    chatId?: string;
    content: string;
    providerId: ProviderId;
    modelId: string;
    modelName: string;
    isTemporaryModel?: boolean;
    attachments?: any[];
  }) => Promise<void>;
  onStopGeneration: () => void;
  isStreaming: boolean;
  models: CustomModel[];
  fixedModel?: CustomModel;
  projects: Project[];
  onApplyCodeToProject: (projectId: string, fileName: string, code: string) => Promise<void>;
  isDemoMode: boolean;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onSendMessage,
  onStopGeneration,
  isStreaming,
  models,
  fixedModel,
  projects,
  onApplyCodeToProject,
  isDemoMode
}) => {
  const [inputText, setInputText] = useState('');
  const [searchHistory, setSearchHistory] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string>(
    fixedModel ? fixedModel.id : models[0]?.id || ''
  );
  const [isTemporaryModel, setIsTemporaryModel] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: number; content: string }[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [projectPickerIndex, setProjectPickerIndex] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync selected model if fixedModel changes
  useEffect(() => {
    if (fixedModel && !isTemporaryModel) {
      setSelectedModelId(fixedModel.id);
    }
  }, [fixedModel, isTemporaryModel]);

  const activeChat = chats.find(c => c.id === currentChatId) || chats[0];
  const activeModel = models.find(m => m.id === selectedModelId) || fixedModel || models[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isStreaming]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isStreaming) return;
    if (!activeModel) {
      alert('Please add or select a Model first');
      return;
    }

    const textToSend = inputText;
    const filesToSend = [...attachments];
    setInputText('');
    setAttachments([]);

    await onSendMessage({
      chatId: activeChat?.id,
      content: textToSend,
      providerId: activeModel.providerId,
      modelId: activeModel.modelId,
      modelName: activeModel.modelName,
      isTemporaryModel,
      attachments: filesToSend
    });

    // If it was a temporary model, reset back to fixed model if exists
    if (isTemporaryModel && fixedModel) {
      setIsTemporaryModel(false);
      setSelectedModelId(fixedModel.id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = ev => {
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            content: (ev.target?.result as string) || ''
          }
        ]);
      };
      reader.readAsText(file);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'aura-snippet.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredChats = chats.filter(c =>
    c.title.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4.2rem)] -m-4 md:-m-6 overflow-hidden bg-slate-950">
      {/* Left Chat History Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 border-r border-slate-800 p-3 space-y-3 shrink-0">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
        >
          <Plus size={15} />
          <span>New Chat</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search chat history..."
            value={searchHistory}
            onChange={e => setSearchHistory(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filteredChats.map(chat => {
            const isSelected = chat.id === activeChat?.id;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                  isSelected
                    ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                    : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <div className="truncate flex-1 pr-2">
                  <div className="font-medium truncate">{chat.title || 'Untitled Chat'}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <span>{chat.modelName || chat.modelId}</span>
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded transition"
                  title="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-950">
        {/* Model Selector Bar */}
        <div className="h-14 border-b border-slate-800 bg-slate-900/60 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Active Model:</span>

            {/* Model Dropdown */}
            <div className="relative">
              <select
                value={selectedModelId}
                onChange={e => {
                  setSelectedModelId(e.target.value);
                  const chosen = models.find(m => m.id === e.target.value);
                  if (chosen && !chosen.isFixed) {
                    setIsTemporaryModel(true);
                  } else {
                    setIsTemporaryModel(false);
                  }
                }}
                className="bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.isFixed ? '🔒 ' : ''}{m.modelName} ({m.modelId})
                  </option>
                ))}
              </select>
            </div>

            {/* Fixed vs Temporary Badge */}
            {activeModel?.isFixed ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                <Lock size={10} /> FIXED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 text-[10px] font-medium border border-indigo-500/30 flex items-center gap-1">
                <Zap size={10} /> TEMPORARY (ONCE)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            {activeChat?.totalOutputTokens ? (
              <span className="font-mono text-[11px] hidden sm:inline">
                Tokens: {activeChat.totalInputTokens || 0} in / {activeChat.totalOutputTokens} out
              </span>
            ) : null}
            <button
              onClick={onNewChat}
              className="md:hidden px-2.5 py-1 bg-indigo-600 text-white text-xs rounded-lg font-medium"
            >
              New Chat
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {(!activeChat?.messages || activeChat.messages.length === 0) && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles size={28} />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-bold text-white">Start a Conversation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  登録した <strong className="text-white">{activeModel?.modelName || 'AI Model'}</strong> (`{activeModel?.modelId}`) とチャットします。コード生成、バグ分析、仕様設計など何でも質問してください。
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full pt-2">
                {[
                  'React + Tailwind でモダンなカードUIコンポーネントを作成して',
                  'REST APIクライアントのTypeScript型安全な実装例を書いて',
                  'Webアプリケーションのパフォーマンス改善チェックリストを教えて',
                  'シンプルなタイピングゲームのHTML/JSワンファイルコードを書いて'
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText(prompt);
                    }}
                    className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs text-slate-300 transition cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeChat?.messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex items-start space-x-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 shadow-md shadow-indigo-600/20'
                    : 'bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md shadow-cyan-600/20'
                }`}
              >
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {msg.role === 'user' ? 'You' : msg.modelName || 'AURA Assistant'}
                  </span>
                  {msg.modelId && (
                    <span className="font-mono bg-slate-900 px-1 rounded text-cyan-400">
                      {msg.modelId}
                    </span>
                  )}
                  {msg.isTemporaryModel && (
                    <span className="text-amber-400 flex items-center gap-0.5">
                      <Zap size={9} /> One-time
                    </span>
                  )}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed space-y-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  {/* Attachments preview if any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-2 border-b border-white/10">
                      {msg.attachments.map((att, aIdx) => (
                        <div
                          key={aIdx}
                          className="px-2 py-1 bg-black/30 rounded-lg text-[10px] font-mono flex items-center gap-1"
                        >
                          <FileText size={11} />
                          <span>{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Message Body with Code Blocks */}
                  {renderMessageContent(msg.content, msg.id, msg.role)}
                </div>
              </div>
            </div>
          ))}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center space-x-2 text-xs text-indigo-400 animate-pulse pl-11">
              <Sparkles size={14} />
              <span>AI is generating response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto space-y-2">
            {/* Attachment Tags */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-1">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 flex items-center gap-1.5"
                  >
                    <FileText size={12} className="text-indigo-400" />
                    <span className="font-mono text-[11px] truncate max-w-[150px]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-center">
              <textarea
                rows={2}
                placeholder={`Ask ${activeModel?.modelName || 'AI'} anything... (Shift+Enter for newline)`}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full pl-4 pr-24 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition"
              />

              <div className="absolute right-3 flex items-center space-x-1.5">
                {/* File Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Attach file / code (TXT, JS, TS, HTML, JSON, MD)"
                >
                  <Paperclip size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Send / Stop Button */}
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={onStopGeneration}
                    className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition cursor-pointer shadow-md shadow-rose-600/20"
                    title="Stop Generation"
                  >
                    <Square size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputText.trim() && attachments.length === 0}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/20"
                    title="Send Message"
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  function renderMessageContent(content: string, msgId: string, role: string) {
    if (role === 'user') {
      return <div className="whitespace-pre-wrap">{content}</div>;
    }

    // Parse code blocks with ```lang ... ```
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3">
        {parts.map((part, pIdx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const lines = part.slice(3, -3).split('\n');
            const lang = lines[0].trim() || 'code';
            const code = lines.slice(1).join('\n');
            const blockId = `${msgId}_${pIdx}`;

            return (
              <div
                key={pIdx}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden my-3 shadow-md"
              >
                <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-cyan-400 font-semibold">{lang}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => copyCode(code, blockId)}
                      className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 transition"
                      title="Copy Code"
                    >
                      {copiedIndex === blockId ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedIndex === blockId ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => downloadCode(code, `code.${lang === 'code' ? 'txt' : lang}`)}
                      className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 transition"
                      title="Download Snippet"
                    >
                      <Download size={11} />
                      <span>Download</span>
                    </button>

                    {projects.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setProjectPickerIndex(projectPickerIndex === blockId ? null : blockId)}
                          className="p-1 px-2 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px] flex items-center gap-1 transition"
                          title="Apply to Project"
                        >
                          <FolderPlus size={11} />
                          <span>Apply to Project</span>
                        </button>

                        {projectPickerIndex === blockId && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 p-2 space-y-1">
                            <span className="text-[10px] font-semibold text-slate-400 block px-1">Select Project:</span>
                            {projects.map(proj => (
                              <button
                                key={proj.id}
                                onClick={() => {
                                  onApplyCodeToProject(proj.id, `src/snippet.${lang === 'code' ? 'ts' : lang}`, code);
                                  setProjectPickerIndex(null);
                                }}
                                className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-xs text-white truncate"
                              >
                                {proj.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <pre className="p-3.5 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          return (
            <div key={pIdx} className="whitespace-pre-wrap leading-relaxed">
              {part}
            </div>
          );
        })}
      </div>
    );
  }
};
