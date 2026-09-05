import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { AnimalSelector } from './components/AnimalSelector';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { AdminPortal } from './components/Admin/AdminPortal';
import type { ChatMessage } from './types';
import { Sparkles, AlertCircle } from 'lucide-react';

const SESSION_KEY = 'ethnovet_chat_session_id';
const THEME_KEY = 'ethnovet_theme';
const ADMIN_TOKEN_KEY = 'ethnovet_admin_token';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const getInitialGreeting = (lang: 'en' | 'ta'): ChatMessage => {
  return {
    id: 'welcome-msg',
    role: 'assistant',
    content:
      lang === 'ta'
        ? `👋 **வணக்கம்! எத்னோவெட் (EthnoVet) மூலிகை மருத்துவ உதவியாளருக்கு நல்வரவு.**

நான் மாடு, ஆடு, கோழி போன்ற கால்நடைகளுக்கான பாரம்பரிய மூலிகை சிகிச்சைகள் மற்றும் முதலுதவிகளை விளக்கும் AI உதவியாளர்.

🌾 **நீங்கள் கேட்கலாம்:**
* *மாட்டுக்கு வயிறு உப்பசம் / செரிமான பிரச்சனை*
* *ஆடுகளுக்கு கழிச்சல் / பேதி கட்டுப்படுத்த*
* *கோழிகளுக்கு அம்மை அல்லது காயம்*
* *பால் உற்பத்தி அதிகரிக்க மூலிகை மருந்து*

கால்நடையின் வகை மற்றும் அறிகுறிகளைத் தெரிவியுங்கள்!`
        : `👋 **Welcome to EthnoVet Chat!**

I am your AI assistant for traditional ethnoveterinary livestock care, powered by verified remedies from the Ethnoveterinary Practice database.

🌿 **You can ask me about:**
* *Bloat, indigestion, or anorexia in cows/cattle*
* *Diarrhea or loose dung in goats & sheep*
* *Wounds, pecking injuries, or fowl pox in poultry*
* *Herbal formulations for increasing milk yield*

Select an animal above or type the symptoms your animal is experiencing!`,
    timestamp: new Date().toISOString(),
    language: lang,
    isAiGenerated: false,
  };
};

export const App: React.FC = () => {
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Admin State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(ADMIN_TOKEN_KEY) : null;
  });
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Apply theme class to document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Toggle theme
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initialize or restore session ID
  useEffect(() => {
    let currentSession = localStorage.getItem(SESSION_KEY);
    if (!currentSession) {
      currentSession =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(SESSION_KEY, currentSession);
    }
    setSessionId(currentSession);
    setMessages([getInitialGreeting(language)]);
  }, []);

  // Update greeting if language changes when only greeting exists
  const handleLanguageChange = (newLang: 'en' | 'ta') => {
    setLanguage(newLang);
    if (messages.length <= 1) {
      setMessages([getInitialGreeting(newLang)]);
    }
  };

  // Scroll to bottom on new message or loading state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send message to backend with real-time SSE streaming
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    const userMsgId = 'usr_' + Date.now();
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      language: language,
    };

    const botMsgId = 'bot_' + Date.now();
    const initialBotMessage: ChatMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      relevantRemedies: [],
      isAiGenerated: false,
      language: language,
    };

    setMessages((prev) => [...prev, userMessage, initialBotMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          animal: selectedAnimal || undefined,
          language: language,
          sessionId: sessionId,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.substring(6).trim();
          if (!jsonStr) continue;

          try {
            const evt = JSON.parse(jsonStr);
            if (evt.eventType === 'meta') {
              if (evt.detectedAnimal && !selectedAnimal) {
                setSelectedAnimal(evt.detectedAnimal.toLowerCase());
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId
                    ? {
                        ...msg,
                        relevantRemedies: evt.relevantRemedies || [],
                        isAiGenerated: evt.isAiGenerated ?? false,
                        language: evt.language || language,
                      }
                    : msg
                )
              );
            } else if (evt.eventType === 'token' && evt.token) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId
                    ? { ...msg, content: msg.content + evt.token }
                    : msg
                )
              );
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }
    } catch (err: any) {
      console.error('Chat streaming error:', err);
      // If no tokens were streamed, clean up the empty bot bubble
      setMessages((prev) => {
        const currentBot = prev.find((m) => m.id === botMsgId);
        if (currentBot && currentBot.content.trim().length > 0) {
          return prev;
        }
        return prev.filter((m) => m.id !== botMsgId);
      });

      setError(
        language === 'ta'
          ? 'மன்னிக்கவும், தகவலைப் பெறுவதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
          : (err.message || 'Failed to get a response. Please check backend connection.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clear session / Reset memory
  const handleNewConsultation = async () => {
    setIsClearing(true);
    setError(null);

    try {
      if (sessionId) {
        await fetch(`${API_BASE}/api/chat/sessions/${sessionId}`, {
          method: 'DELETE',
        }).catch(() => {
          // ignore cleanup network issues
        });
      }
    } finally {
      const newSession =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(SESSION_KEY, newSession);
      setSessionId(newSession);
      setSelectedAnimal(null);
      setMessages([getInitialGreeting(language)]);
      setIsClearing(false);
    }
  };

  // Admin Actions
  const handleOpenAdmin = () => {
    if (adminToken) {
      setIsAdminPortalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (token: string) => {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    setAdminToken(token);
    setIsAdminPortalOpen(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken(null);
    setIsAdminPortalOpen(false);
  };

  // If Admin Portal is actively opened and user is authenticated, render Admin View
  if (isAdminPortalOpen && adminToken) {
    return (
      <AdminPortal
        apiBaseUrl={API_BASE}
        adminToken={adminToken}
        onBackToChat={() => setIsAdminPortalOpen(false)}
        onLogout={handleAdminLogout}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAdmin={handleOpenAdmin}
        isAdminLoggedIn={!!adminToken}
        onNewConsultation={handleNewConsultation}
        isClearing={isClearing}
      />

      {/* Animal Quick Filter Pill Bar */}
      <AnimalSelector
        selectedAnimal={selectedAnimal}
        onSelectAnimal={setSelectedAnimal}
        language={language}
      />

      {/* Main Chat Scroll Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Active Session Info Pill */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">
                {language === 'ta'
                  ? 'செயலில் உள்ள அமர்வு (5 உரையாடல்கள் நினைவகம்):'
                  : 'Active Multi-turn Session (5-turn Memory):'}
              </span>
              <code className="text-[10px] text-slate-600 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                {sessionId ? sessionId.substring(0, 8) + '...' : 'initializing'}
              </code>
            </div>
            {selectedAnimal && (
              <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium px-2 py-0.5 rounded-full capitalize text-[10px]">
                {selectedAnimal}
              </span>
            )}
          </div>

          {/* Messages */}
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} language={language} />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 my-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                  {language === 'ta'
                    ? 'மூலிகை தரவுத்தளத்தில் தேடுகிறது...'
                    : 'Searching remedies & formulating advice...'}
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl flex items-center justify-between text-xs text-red-800 dark:text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-700 dark:text-red-400 hover:text-red-900 font-semibold underline text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Section */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        language={language}
        selectedAnimal={selectedAnimal}
      />

      {/* Global Disclaimer Footer */}
      <footer className="text-center py-2 px-4 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 transition-colors duration-200">
        <p className="m-0">
          {language === 'ta'
            ? '⚠️ பாரம்பரிய மூலிகை மருத்துவ முறைகள் முதலுதவிக்காக மட்டுமே. அவசர மற்றும் தீவிர நிலைகளில் உடனடியாக கால்நடை மருத்துவரை அணுகவும்.'
            : '⚠️ Traditional remedies are supportive practices for common conditions. In emergencies or severe acute diseases, consult a registered veterinarian.'}
        </p>
      </footer>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        apiBaseUrl={API_BASE}
      />
    </div>
  );
};

export default App;
