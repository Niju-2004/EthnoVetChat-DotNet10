import React, { useState } from 'react';
import { Database, BarChart3, MessageSquare, Cpu, LogOut, ArrowLeft, ShieldCheck } from 'lucide-react';
import { RemedyManager } from './RemedyManager';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ChatMonitor } from './ChatMonitor';
import { AiConfigView } from './AiConfigView';

interface AdminPortalProps {
  apiBaseUrl: string;
  adminToken: string;
  onBackToChat: () => void;
  onLogout: () => void;
}

type TabType = 'remedies' | 'analytics' | 'chats' | 'ai';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  apiBaseUrl,
  adminToken,
  onBackToChat,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('remedies');

  const handleUnauthorized = () => {
    alert('Admin session expired. Please log in again.');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Portal Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/90 flex items-center justify-center shadow-md border border-emerald-400/30">
              <ShieldCheck className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white m-0">EthnoVet Portal</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">
                Veterinary Knowledge Base & AI Analytics System
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBackToChat}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Farmer Chat</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-red-100 rounded-lg text-xs font-semibold border border-red-800/80 transition-all cursor-pointer"
              title="End admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 border-t border-slate-800 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('remedies')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'remedies'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Remedy Database</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'chats'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Consultation Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'ai'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Hyperparameters</span>
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'remedies' && (
          <RemedyManager
            apiBaseUrl={apiBaseUrl}
            adminToken={adminToken}
            onUnauthorized={handleUnauthorized}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            apiBaseUrl={apiBaseUrl}
            adminToken={adminToken}
            onUnauthorized={handleUnauthorized}
          />
        )}
        {activeTab === 'chats' && (
          <ChatMonitor
            apiBaseUrl={apiBaseUrl}
            adminToken={adminToken}
            onUnauthorized={handleUnauthorized}
          />
        )}
        {activeTab === 'ai' && (
          <AiConfigView
            apiBaseUrl={apiBaseUrl}
            adminToken={adminToken}
            onUnauthorized={handleUnauthorized}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-3 px-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center text-xs text-slate-500 dark:text-slate-400">
        EthnoVet Chat Production Portal • Secured with HMAC-SHA256 & Brute-Force Rate Limiting
      </footer>
    </div>
  );
};

