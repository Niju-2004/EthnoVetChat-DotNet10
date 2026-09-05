import React, { useState, useEffect } from 'react';
import { Clock, User, Bot, RefreshCw, Search, ShieldCheck } from 'lucide-react';

interface ChatMonitorProps {
  apiBaseUrl: string;
  adminToken: string;
  onUnauthorized: () => void;
}

interface ChatSessionSummary {
  sessionId: string;
  userId?: string | null;
  username?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  title?: string;
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
  const [searchTerm, setSearchTerm] = useState('');
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
      } else if (selectedSession) {
        const updated = data.find((s: ChatSessionSummary) => s.sessionId === selectedSession.sessionId);
        if (updated) setSelectedSession(updated);
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

  const filteredSessions = sessions.filter((s) => {
    const term = searchTerm.toLowerCase();
    const uname = (s.username || '').toLowerCase();
    const email = (s.userEmail || '').toLowerCase();
    const sid = (s.sessionId || '').toLowerCase();
    const title = (s.title || '').toLowerCase();
    const anim = (s.persistedAnimal || '').toLowerCase();
    return (
      uname.includes(term) ||
      email.includes(term) ||
      sid.includes(term) ||
      title.includes(term) ||
      anim.includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Farmer Consultation Audit
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Audit consultations by farmer username, registered email, and animal species
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by farmer or animal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-emerald-500 w-48 sm:w-60"
            />
          </div>
          <button
            onClick={fetchSessions}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Session List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Farmer Consultations ({filteredSessions.length})</span>
            {searchTerm && (
              <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                Filtered
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[550px] overflow-y-auto">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {searchTerm ? 'No matching farmer consultations found.' : 'No consultations recorded yet.'}
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isSelected = selectedSession?.sessionId === s.sessionId;
                const badge = getSafetyBadge(s);
                return (
                  <button
                    key={s.sessionId}
                    onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-3 transition-colors cursor-pointer block ${
                      isSelected
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {s.username || 'Farmer'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    {s.userEmail && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1">
                        {s.userEmail}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="capitalize font-semibold text-emerald-600 dark:text-emerald-400">
                        {s.persistedAnimal || 'General'}
                      </span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-mono">{s.persistedLanguage}</span>
                      <span>•</span>
                      <span>{s.messageCount} msgs</span>
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
              {/* Farmer Profile Header */}
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shadow-xs">
                      {selectedSession.username ? selectedSession.username[0].toUpperCase() : 'F'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                          {selectedSession.username || 'Farmer'}
                        </h4>
                        <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          {selectedSession.userRole || 'Farmer'}
                        </span>
                      </div>
                      {selectedSession.userEmail && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                          {selectedSession.userEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(selectedSession.lastActiveAt).toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Session: {selectedSession.sessionId.substring(0, 12)}...
                    </div>
                  </div>
                </div>

                {/* Consultation Details Pill */}
                <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-slate-600 dark:text-slate-300">
                  <div>
                    Animal: <b className="capitalize text-emerald-600 dark:text-emerald-400">{selectedSession.persistedAnimal || 'General'}</b>
                  </div>
                  <div>•</div>
                  <div>
                    Language: <b className="uppercase font-mono">{selectedSession.persistedLanguage}</b>
                  </div>
                  <div>•</div>
                  <div className="truncate max-w-[280px]">
                    Title: <span className="italic">{selectedSession.title || 'Veterinary Triage'}</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-2">
                {selectedSession.recentMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No messages in this consultation yet.
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
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-1 font-bold text-[10px]">
                            {selectedSession.username ? selectedSession.username[0].toUpperCase() : 'U'}
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
              Select a farmer consultation on the left to view the complete audit transcript.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
