import React from 'react';
import {
  Layers,
  BarChart3,
  TrendingUp,
  Cpu,
  Coins,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UsageLog } from '../types';

interface UsagePageProps {
  usage: UsageLog[];
}

export const UsagePage: React.FC<UsagePageProps> = ({ usage }) => {
  const totalRequests = usage.length;
  const totalInputTokens = usage.reduce((s, u) => s + (u.inputTokens || 0), 0);
  const totalOutputTokens = usage.reduce((s, u) => s + (u.outputTokens || 0), 0);
  const totalTokens = usage.reduce((s, u) => s + (u.totalTokens || 0), 0);

  // Group by Provider
  const byProvider: Record<string, { requests: number; tokens: number; cost: number }> = {};
  usage.forEach(u => {
    if (!byProvider[u.providerId]) {
      byProvider[u.providerId] = { requests: 0, tokens: 0, cost: 0 };
    }
    byProvider[u.providerId].requests += 1;
    byProvider[u.providerId].tokens += u.totalTokens || 0;
    byProvider[u.providerId].cost += u.estimatedCost || 0;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Layers size={16} />
            <span>Telemetry &amp; Cost Auditing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Usage &amp; Estimates
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            ユーザー自身のAPIキーで行われたすべてのAIリクエスト・トークン消費量を記録しています。各プロバイダーごとの利用料金はご自身のプロバイダーダッシュボードで直接課金されます。
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">Total Invocations</span>
          <div className="text-2xl font-bold text-white">{totalRequests}</div>
          <span className="text-[10px] text-slate-400 font-mono">Chat, Build, Diff &amp; Agent</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">Input Tokens</span>
          <div className="text-2xl font-bold text-white">{totalInputTokens.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400 font-mono">Prompt &amp; context</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">Output Tokens</span>
          <div className="text-2xl font-bold text-white">{totalOutputTokens.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400 font-mono">Generated code &amp; text</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">Total Tokens</span>
          <div className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-400 font-mono">Accurate token tracking</span>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 size={17} className="text-indigo-400" />
          <span>Usage by Provider</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(byProvider).map(([providerId, data]) => (
            <div
              key={providerId}
              className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white uppercase font-mono">{providerId}</span>
                <span className="text-[10px] text-slate-400">{data.requests} reqs</span>
              </div>
              <div className="text-lg font-bold text-cyan-400 font-mono">
                {data.tokens.toLocaleString()} <span className="text-xs text-slate-400">tokens</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Est. Provider Cost: {data.cost > 0 ? `$${data.cost.toFixed(5)}` : 'Unknown (Check Provider)'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp size={17} className="text-indigo-400" />
          <span>Recent Execution Logs</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] text-slate-400 font-mono uppercase">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Provider / Model ID</th>
                <th className="py-2.5 px-3">Input</th>
                <th className="py-2.5 px-3">Output</th>
                <th className="py-2.5 px-3">Total Tokens</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {usage.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2 px-3 text-[11px] text-slate-400">
                    {new Date(u.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-300 uppercase font-sans font-semibold">
                      {u.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 truncate max-w-[200px]" title={u.modelId}>
                    <span className="text-slate-400 text-[10px] uppercase font-sans mr-1">{u.providerId}</span>
                    <span className="text-cyan-400">{u.modelId}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">{u.inputTokens?.toLocaleString()}</td>
                  <td className="py-2 px-3 text-slate-400">{u.outputTokens?.toLocaleString()}</td>
                  <td className="py-2 px-3 text-white font-semibold">{u.totalTokens?.toLocaleString()}</td>
                  <td className="py-2 px-3">
                    {u.status === 'success' ? (
                      <span className="text-emerald-400 font-sans text-[11px] flex items-center gap-1">
                        <CheckCircle2 size={12} /> Success
                      </span>
                    ) : (
                      <span className="text-rose-400 font-sans text-[11px] flex items-center gap-1">
                        <AlertCircle size={12} /> Error
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
