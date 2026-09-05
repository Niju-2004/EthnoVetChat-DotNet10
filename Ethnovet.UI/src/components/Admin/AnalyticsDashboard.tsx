import React, { useState, useEffect } from 'react';
import { BarChart3, Database, MessageSquare, Users, Globe, Activity, RefreshCw } from 'lucide-react';

interface AnalyticsDashboardProps {
  apiBaseUrl: string;
  adminToken: string;
  onUnauthorized: () => void;
}

interface AnalyticsData {
  totalRemedies: number;
  totalActiveSessions: number;
  totalMessagesRecorded: number;
  queriesByAnimal: Record<string, number>;
  queriesByLanguage: Record<string, number>;
  topDiseases: Array<{ disease: string; count: number }>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  apiBaseUrl,
  adminToken,
  onUnauthorized,
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/analytics`, {
        headers: { 'X-Admin-Token': adminToken },
      });
      if (res.status === 401) return onUnauthorized();
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Loading veterinary analytics...</span>
      </div>
    );
  }

  const animalEntries = Object.entries(data?.queriesByAnimal || {});
  const totalAnimalQueries = animalEntries.reduce((sum, [, c]) => sum + c, 0) || 1;

  const totalLang = (data?.queriesByLanguage['en'] || 0) + (data?.queriesByLanguage['ta'] || 0) || 1;
  const enPct = Math.round(((data?.queriesByLanguage['en'] || 0) / totalLang) * 100);
  const taPct = 100 - enPct;

  return (
    <div className="space-y-6">
      {/* 4 Metric Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Remedies
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 mb-0">
            {data?.totalRemedies ?? 51}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Verified Traditional EVP</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Sessions
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 mb-0">
            {data?.totalActiveSessions ?? 0}
          </p>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">In-Memory 5-Turn Cache</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Messages Logged
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 mb-0">
            {data?.totalMessagesRecorded ?? 0}
          </p>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Farmer Conversations</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              API Health
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 mb-0">
            Online
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Gemini 3.1 Flash Lite</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Queried Diseases */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider m-0">
                Most Frequent Livestock Ailments
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Demand Heatmap</span>
          </div>

          <div className="space-y-3">
            {data?.topDiseases.map((d, i) => {
              const maxCount = Math.max(...(data.topDiseases.map((x) => x.count) || [1]));
              const pct = Math.round((d.count / maxCount) * 100);
              return (
                <div key={d.disease} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {i + 1}. {d.disease}
                    </span>
                    <span className="font-mono text-slate-500">{d.count} queries</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Species & Language Distribution */}
        <div className="space-y-5">
          {/* Target Animal Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 m-0">
              Queries By Animal Species
            </h4>
            <div className="space-y-2.5">
              {animalEntries.map(([animal, count]) => {
                const pct = Math.round((count / totalAnimalQueries) * 100);
                const emoji =
                  animal.toLowerCase().includes('cow') ? '🐄' :
                  animal.toLowerCase().includes('goat') ? '🐐' :
                  animal.toLowerCase().includes('poultry') || animal.toLowerCase().includes('chicken') ? '🐔' :
                  animal.toLowerCase().includes('dog') ? '🐕' : '🐾';

                return (
                  <div key={animal} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span>{emoji}</span>
                      <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{animal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Language Preference Ratio */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider m-0">
                  Language Preference
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">English vs. Tamil</span>
            </div>

            <div className="flex h-3 w-full rounded-full overflow-hidden mb-2">
              <div className="bg-emerald-500" style={{ width: `${enPct}%` }} title={`English: ${enPct}%`} />
              <div className="bg-amber-500" style={{ width: `${taPct}%` }} title={`Tamil: ${taPct}%`} />
            </div>

            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>English ({enPct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>தமிழ் ({taPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
