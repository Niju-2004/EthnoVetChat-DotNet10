import React, { useState, useEffect } from 'react';
import { Clock, User, Bot, RefreshCw } from 'lucide-react';

interface ChatMonitorProps {
  apiBaseUrl: string;
  adminToken: string;
  onUnauthorized: () => void;
}

interface ChatSessionSummary {
  sessionId: string;
  createdAt: string;
  lastActiveAt: string;
  persistedAnimal: string | null;
  persistedLanguage: string;
  messageCount: number;
  recentMessages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

export const ChatMonitor: React.FC<ChatMonitorProps> = ({
  apiBaseUrl,
  adminToken,
  onUnauthorized,
}) => {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSessionSummary | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/chats`, {
        headers: { 'X-Admin-Token': adminToken },
      });
      if (res.status === 401) return onUnauthorized();
      if (!res.ok) throw new Error('Failed to load chat sessions');
      const data = await res.json();
      setSessions(data);
      if (data.length > 0 && !selectedSession) {
        setSelectedSession(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const getSafetyBadge = (session: ChatSessionSummary) => {
    const text = session.recentMessages.map((m) => m.content).join(' ').toLowerCase();
    if (text.includes('poison') || text.includes('fracture') || text.includes('collapse') || text.includes('bleeding')) {
      return { label: 'Emergency Alert', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' };
    }
    if (session.persistedAnimal === 'dog' && (text.includes('ruminant') || text.includes('vomit'))) {
      return { label: 'Dog Safety Check', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
    }
    return { label: 'Standard Triage', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">Live Consultation Monitor</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Real-time audit of multi-turn veterinary conversations</p>
        </div>
        <button
          onClick={fetchSessions}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg text-xs font-medium cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Session List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
            Active Sessions ({sessions.length})
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No active conversations recorded yet.
              </div>
            ) : (
              sessions.map((s) => {
                const isSelected = selectedSession?.sessionId === s.sessionId;
                const badge = getSafetyBadge(s);
                return (
                  <button
                    key={s.sessionId}
                    onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-3 transition-colors cursor-pointer block ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                        {s.sessionId}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="capitalize font-semibold">{s.persistedAnimal || 'General'}</span>
                      <span className="text-slate-400">•</span>
                      <span className="uppercase text-[10px] font-mono">{s.persistedLanguage}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-[11px] text-slate-400">{s.messageCount} msgs</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Transcript Detail */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col h-[550px]">
          {selectedSession ? (
            <>
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 m-0">
                    Transcript: <span className="font-mono font-normal text-emerald-600">{selectedSession.sessionId}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 m-0">
                    Animal: <b className="capitalize text-slate-600 dark:text-slate-300">{selectedSession.persistedAnimal || 'Unspecified'}</b> | Lang: <b className="uppercase">{selectedSession.persistedLanguage}</b>
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(selectedSession.lastActiveAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-2">
                {selectedSession.recentMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No messages in this session yet.
                  </div>
                ) : (
                  selectedSession.recentMessages.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={i} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {!isUser && (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-xl p-2.5 text-xs leading-relaxed ${
                            isUser
                              ? 'bg-emerald-600 text-white font-medium'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {isUser && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-1">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Select a consultation session on the left to view the live transcript.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
