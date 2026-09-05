import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { AnimalSelector } from './components/AnimalSelector';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { AdminPortal } from './components/Admin/AdminPortal';
import { RegisterWizard } from './components/Auth/RegisterWizard';
import { LoginModal } from './components/Auth/LoginModal';
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer';
import { LandingPage } from './components/LandingPage';
import type { ChatMessage, User as UserType, Remedy } from './types';
import { Sparkles, AlertCircle, BookmarkPlus, Lock, LogIn, UserCheck } from 'lucide-react';

const SESSION_KEY = 'ethnovet_chat_session_id';
const THEME_KEY = 'ethnovet_theme';
const ADMIN_TOKEN_KEY = 'ethnovet_admin_token';
const USER_TOKEN_KEY = 'ethnovet_user_token';
const USER_DATA_KEY = 'ethnovet_user_data';
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
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    try {
      const saved = localStorage.getItem(USER_DATA_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userToken, setUserToken] = useState<string | null>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(USER_TOKEN_KEY) : null;
  });

  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Active View State: default to 'guide' for new/unauthenticated visitors so they understand what the app does; 'chat' if logged in
  const [activeView, setActiveView] = useState<'chat' | 'guide'>(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem(USER_TOKEN_KEY) ? 'chat' : 'guide';
  });

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

  // Set user language preference if logged in on load
  useEffect(() => {
    if (currentUser?.preferredLanguage) {
      setLanguage(currentUser.preferredLanguage);
    }
  }, []);

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
    setMessages([getInitialGreeting(currentUser?.preferredLanguage || language)]);
  }, []);

  // Update language and sync with backend if user is logged in
  const handleLanguageChange = (newLang: 'en' | 'ta') => {
    setLanguage(newLang);
    if (messages.length <= 1) {
      setMessages([getInitialGreeting(newLang)]);
    }

    if (userToken) {
      fetch(`${API_BASE}/api/auth/language`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ language: newLang }),
      }).catch((e) => console.warn('Language sync error:', e));

      if (currentUser) {
        const updated = { ...currentUser, preferredLanguage: newLang };
        setCurrentUser(updated);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(updated));
      }
    }
  };

  // Scroll to bottom on new message or loading state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send message to backend with real-time SSE streaming
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check mandatory farmer authentication
    if (!currentUser || !userToken) {
      setIsLoginOpen(true);
      return;
    }

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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }

      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: headers,
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

  // Load a historical consultation from PostgreSQL
  const handleSelectHistoricalSession = async (targetSessionId: string) => {
    if (!userToken) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/chat/user-sessions/${targetSessionId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (!res.ok) throw new Error('Could not load consultation');
      const detail = await res.json();

      setSessionId(detail.sessionId);
      localStorage.setItem(SESSION_KEY, detail.sessionId);
      if (detail.animal) setSelectedAnimal(detail.animal);
      if (detail.language) setLanguage(detail.language);

      const loadedMessages: ChatMessage[] = detail.messages.map((m: any) => {
        let remedies: Remedy[] = [];
        if (m.relevantRemediesJson) {
          try {
            remedies = JSON.parse(m.relevantRemediesJson);
          } catch {}
        }
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          relevantRemedies: remedies,
          isAiGenerated: m.isAiGenerated,
          language: detail.language,
        };
      });

      setMessages(loadedMessages.length > 0 ? loadedMessages : [getInitialGreeting(language)]);
    } catch (err: any) {
      setError(err.message || 'Failed to load historical consultation.');
    } finally {
      setIsLoading(false);
    }
  };

  // User Auth Handlers
  const handleAuthSuccess = (token: string, user: UserType) => {
    localStorage.setItem(USER_TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    setUserToken(token);
    setCurrentUser(user);
    if (user.preferredLanguage) {
      setLanguage(user.preferredLanguage);
    }
    setActiveView('chat');
  };

  const handleStartConsultation = (initialPrompt?: string) => {
    setActiveView('chat');
    if (!currentUser || !userToken) {
      setIsLoginOpen(true);
      return;
    }
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  };

  const handleUserLogout = () => {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    setUserToken(null);
    setCurrentUser(null);
  };

  // Admin Actions
  const handleOpenAdmin = () => {
    if (adminToken) {
      setIsAdminPortalOpen(true);
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = (token: string) => {
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
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 z-30">
        <Header
          language={language}
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenAdmin={handleOpenAdmin}
          isAdminLoggedIn={!!adminToken}
          onNewConsultation={handleNewConsultation}
          isClearing={isClearing}
          currentUser={currentUser}
          onOpenAuth={(mode) => {
            if (mode === 'register') setIsRegisterOpen(true);
            else setIsLoginOpen(true);
          }}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onLogout={handleUserLogout}
          currentView={activeView}
          onToggleView={setActiveView}
        />
      </div>

      {activeView === 'guide' ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          <LandingPage
            language={language}
            currentUser={currentUser}
            onStartConsultation={handleStartConsultation}
            onOpenAuth={(mode) => {
              if (mode === 'register') setIsRegisterOpen(true);
              else setIsLoginOpen(true);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Animal Quick Filter Pill Bar */}
          <div className="shrink-0 z-10 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
            <AnimalSelector
              selectedAnimal={selectedAnimal}
              onSelectAnimal={setSelectedAnimal}
              language={language}
            />
          </div>

          {/* Main Chat Scroll Area */}
          <main className="flex-1 overflow-y-auto min-h-0 w-full">
            <div className="max-w-4xl mx-auto px-2.5 sm:px-4 py-2.5 sm:py-3 space-y-3 sm:space-y-4">
              {/* Active Session Info Pill */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 rounded-lg px-2.5 sm:px-3 py-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="font-medium truncate">
                    {currentUser ? (
                      <>
                        <span className="hidden sm:inline">
                          {language === 'ta' ? 'விவசாயி கணக்கு (கிளவுட் சேமிப்பு):' : 'Cloud Session:'}
                        </span>
                        <span className="sm:hidden">Cloud:</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">
                          {language === 'ta' ? 'உள்நுழைவு தேவை:' : 'Sign In Required:'}
                        </span>
                        <span className="sm:hidden">Session:</span>
                      </>
                    )}
                  </span>
                  <code className="text-[10px] text-slate-600 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded shrink-0">
                    {sessionId ? sessionId.substring(0, 8) : 'init'}
                  </code>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!currentUser && (
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <BookmarkPlus className="w-3 h-3" />
                      <span className="hidden sm:inline">{language === 'ta' ? 'கணக்கில் சேமிக்க பதிவு செய்' : 'Sign up to save'}</span>
                      <span className="sm:hidden">{language === 'ta' ? 'பதிவு' : 'Sign up'}</span>
                    </button>
                  )}
                  {selectedAnimal && (
                    <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium px-2 py-0.5 rounded-full capitalize text-[10px]">
                      {selectedAnimal}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              {messages.map((msg) => (
                <MessageItem key={msg.id} message={msg} language={language} />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5 sm:gap-3 my-3 sm:my-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs px-3 sm:px-4 py-2.5 sm:py-3 shadow-xs flex items-center gap-2">
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

          {/* Bottom Docked Section: Input & Disclaimer Footer */}
          <div className="shrink-0 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xs z-20">
            {currentUser ? (
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                language={language}
                selectedAnimal={selectedAnimal}
              />
            ) : (
              <div className="max-w-4xl w-full mx-auto px-2.5 sm:px-4 py-2.5 sm:py-3">
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-emerald-500/40 dark:border-emerald-600/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                      {language === 'ta'
                        ? 'கால்நடை மருத்துவ ஆலோசனை பெற உள்நுழையவும்'
                        : 'Farmer Sign In Required'}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-0.5 mb-0 leading-snug">
                      {language === 'ta'
                        ? 'உங்கள் கால்நடைகளுக்கான மூலிகை மருத்துவ ஆலோசனையைப் பெறவும், முந்தைய மருத்துவக் குறிப்புகளைப் பாதுகாப்பாகச் சேமிக்கவும் உள்நுழையவும்.'
                        : 'To consult the EthnoVet AI assistant and securely track your treatment history, please sign in or register.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 w-full sm:w-auto pt-0.5">
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'உள்நுழையவும்' : 'Sign In'}</span>
                    </button>
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'பதிவு' : 'Register'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Global Disclaimer Footer */}
            <footer className="text-center py-1.5 px-2.5 sm:px-4 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-100/40 dark:bg-slate-900/40">
              <p className="m-0 leading-tight">
                {language === 'ta'
                  ? '⚠️ பாரம்பரிய மூலிகை மருத்துவ முறைகள் முதலுதவிக்காக மட்டுமே. தீவிர நிலைகளில் கால்நடை மருத்துவரை அணுகவும்.'
                  : '⚠️ Traditional remedies are supportive practices for common conditions. In emergencies, consult a veterinarian.'}
              </p>
            </footer>
          </div>
        </div>
      )}

      {/* 3-Stage Farmer Registration Wizard */}
      <RegisterWizard
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
        apiBaseUrl={API_BASE}
      />

      {/* Farmer Sign In Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        apiBaseUrl={API_BASE}
      />

      {/* Consultation History Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectHistoricalSession}
        onNewChat={handleNewConsultation}
        apiBaseUrl={API_BASE}
        userToken={userToken}
        activeSessionId={sessionId}
        onOpenAuth={(mode) => {
          if (mode === 'register') setIsRegisterOpen(true);
          else setIsLoginOpen(true);
        }}
        language={language}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        apiBaseUrl={API_BASE}
      />
    </div>
  );
};

export default App;

