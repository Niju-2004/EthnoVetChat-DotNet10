import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertCircle, RefreshCw, Zap, Server, ShieldCheck } from 'lucide-react';

interface AiConfigViewProps {
  apiBaseUrl: string;
  adminToken: string;
  onUnauthorized: () => void;
}

interface AiConfigData {
  activeModel: string;
  maxOutputTokens: number;
  temperature: number;
  isGeminiConfigured: boolean;
  availableModels: string[];
}

export const AiConfigView: React.FC<AiConfigViewProps> = ({
  apiBaseUrl,
  adminToken,
  onUnauthorized,
}) => {
  const [config, setConfig] = useState<AiConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/ai-config`, {
        headers: { 'X-Admin-Token': adminToken },
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Failed to load AI configuration');
      const data = await res.json();
      setConfig(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching AI settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">AI Model & Hyperparameter Status</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              Live Google Gemini LLM settings and RAG grounding parameters
            </p>
          </div>
        </div>

        <button
          onClick={fetchConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of AI Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gemini Engine Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 m-0">
                LLM Core Engine
              </h4>
            </div>
            {config?.isGeminiConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                API Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                <AlertCircle className="w-3 h-3" />
                Fallback RAG Mode
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Active Production Model
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                {config?.activeModel || 'gemini-3.1-flash-lite'}
              </span>
              <span className="text-[11px] text-slate-400">High-speed streaming</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Configured Compatible Models
            </label>
            <div className="flex flex-wrap gap-2">
              {(config?.availableModels || ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash']).map(
                (model) => (
                  <span
                    key={model}
                    className={`text-xs px-2.5 py-1 rounded-lg font-mono ${
                      model === config?.activeModel
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {model}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
            Render environment uses <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">Gemini:Model</code> to switch model targets without downtime.
          </div>
        </div>

        {/* Hyperparameters & RAG Grounding */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 m-0">
                Inference Hyperparameters
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Deterministic (Low Hallucination)</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Temperature</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{config?.temperature ?? 0.2}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '20%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">0.2 tuned strictly for medical safety & veterinary precision</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Max Output Tokens</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{config?.maxOutputTokens ?? 800}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Concise structured remedies without long verbose latency</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">RAG Grounding: 51 Verified Traditional EVP Recipes</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">Session Memory: 5-Turn In-Memory Sliding Window</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
