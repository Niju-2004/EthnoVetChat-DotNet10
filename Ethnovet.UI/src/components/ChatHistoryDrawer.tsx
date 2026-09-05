import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Plus, Trash2, Clock, Calendar, RefreshCw } from 'lucide-react';
import type { UserSessionSummary } from '../types';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  apiBaseUrl: string;
  userToken: string | null;
  activeSessionId: string;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSession,
  onNewChat,
  apiBaseUrl,
  userToken,
  activeSessionId,
}) => {
  const [sessions, setSessions] = useState<UserSessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!userToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/chat/user-sessions`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to load past consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userToken) {
      fetchSessions();
    }
  }, [isOpen, userToken]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!userToken) return;

    setDeletingId(sessionId);
    try {
      const res = await fetch(`${apiBaseUrl}/api/chat/user-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
        if (sessionId === activeSessionId) {
          onNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm m-0">My Consultations</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: New Consultation */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Consultation</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              <span>Loading saved history...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="m-0">No past consultations found.</p>
              <p className="text-[11px] text-slate-500 m-0">
                Your conversations will be saved permanently to your account.
              </p>
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.sessionId === activeSessionId;
              const dateStr = new Date(s.lastActiveAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s.sessionId);
                    onClose();
                  }}
                  className={`group p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      {s.animal && (
                        <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded capitalize">
                          {s.animal}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {s.language}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate m-0">
                      {s.title || 'Veterinary Consultation'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </span>
                      <span>•</span>
                      <span>{s.messageCount} messages</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, s.sessionId)}
                    disabled={deletingId === s.sessionId}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all cursor-pointer"
                    title="Delete consultation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
          Backed up to Neon.tech PostgreSQL
        </div>
      </div>
    </div>
  );
};

