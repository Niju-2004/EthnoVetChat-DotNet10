import React, { useState } from 'react';
import {
  Leaf,
  RotateCcw,
  Globe,
  Sparkles,
  Sun,
  Moon,
  ShieldCheck,
  User,
  Clock,
  LogOut,
  LogIn,
  BookOpen,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import type { User as UserType } from '../types';

interface HeaderProps {
  language: 'en' | 'ta';
  onLanguageChange: (lang: 'en' | 'ta') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  onNewConsultation: () => void;
  isClearing?: boolean;
  currentUser: UserType | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenHistory: () => void;
  onLogout: () => void;
  currentView?: 'chat' | 'guide';
  onToggleView?: (view: 'chat' | 'guide') => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  theme,
  onToggleTheme,
  onOpenAdmin,
  isAdminLoggedIn,
  onNewConsultation,
  isClearing = false,
  currentUser,
  onOpenAuth,
  onOpenHistory,
  onLogout,
  currentView = 'chat',
  onToggleView,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-emerald-800 dark:bg-slate-900 text-white shadow-md border-b border-emerald-700/50 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-700/80 dark:bg-emerald-950/80 border border-emerald-500/30 dark:border-emerald-800/80 flex items-center justify-center shadow-inner shrink-0">
            <Leaf className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-300 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-xl font-bold tracking-tight text-white m-0 whitespace-nowrap">
                EthnoVet Chat
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold bg-emerald-700/80 dark:bg-emerald-900/60 text-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-600/40 dark:border-emerald-700/50 shrink-0">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />
                AI RAG
              </span>
            </div>
            <p className="hidden md:block text-xs text-emerald-200/90 dark:text-slate-400 m-0 truncate">
              {language === 'ta'
                ? 'பாரம்பரிய மூலிகை கால்நடை மருத்துவ வழிகாட்டி'
                : 'Verified Traditional Ethnoveterinary Care for Farmers'}
            </p>
          </div>
        </div>

        {/* Mobile Actions (< sm) */}
        <div className="flex items-center gap-1.5 sm:hidden shrink-0">
          {/* Guide / Chat View Switcher (Mobile icon button) */}
          {onToggleView && (
            <button
              onClick={() => {
                onToggleView(currentView === 'guide' ? 'chat' : 'guide');
                setIsMobileMenuOpen(false);
              }}
              title={currentView === 'guide' ? 'Open Chat Consultation' : 'About & Capabilities'}
              className="p-1.5 sm:px-2 py-1.5 bg-emerald-700/80 dark:bg-slate-800 text-emerald-100 hover:text-white rounded-lg border border-emerald-600/50 dark:border-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
            >
              {currentView === 'guide' ? (
                <>
                  <MessageSquare className="w-4 h-4 text-emerald-300" />
                  <span className="text-[11px] font-medium">Chat</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span className="text-[11px] font-medium">Guide</span>
                </>
              )}
            </button>
          )}

          {/* Quick Sign In or User indicator */}
          {currentUser ? (
            <button
              onClick={() => {
                onOpenHistory();
                setIsMobileMenuOpen(false);
              }}
              title={`Logged in as ${currentUser.username}`}
              className="flex items-center gap-1 px-2 py-1.5 bg-emerald-900/70 dark:bg-slate-800 rounded-lg border border-emerald-700/60 text-xs text-emerald-200 cursor-pointer active:scale-95"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="max-w-[60px] truncate text-[11px] font-semibold">{currentUser.username}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onOpenAuth('register');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer border border-emerald-500/60 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="text-[11px]">Sign In</span>
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 bg-emerald-700/80 dark:bg-slate-800 text-emerald-100 hover:text-white rounded-lg border border-emerald-600/50 dark:border-slate-700 cursor-pointer relative"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {isAdminLoggedIn && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-800" />
            )}
          </button>
        </div>

        {/* Desktop Actions (>= sm) */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-2.5">
          {/* Guide / Chat View Switcher */}
          {onToggleView && (
            <button
              onClick={() => onToggleView(currentView === 'guide' ? 'chat' : 'guide')}
              title={currentView === 'guide' ? 'Open Chat Consultation' : 'About & Capabilities'}
              className="px-2.5 py-1.5 bg-emerald-700/80 dark:bg-slate-800 text-emerald-100 hover:text-white hover:bg-emerald-600 dark:hover:bg-slate-700 rounded-lg border border-emerald-600/50 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {currentView === 'guide' ? (
                <>
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{language === 'ta' ? 'ஆலோசனை அரட்டை' : 'Chat'}</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'ta' ? 'அறிமுகம் & வழிகாட்டி' : 'About & Guide'}</span>
                </>
              )}
            </button>
          )}

          {/* History Button (When logged in) */}
          {currentUser && (
            <button
              onClick={onOpenHistory}
              title="View Past Consultations"
              className="p-2 bg-emerald-700/70 dark:bg-slate-800 text-emerald-100 dark:text-emerald-300 hover:text-white hover:bg-emerald-600 dark:hover:bg-slate-700 rounded-lg border border-emerald-600/50 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold">History</span>
            </button>
          )}

          {/* User Account / Sign In */}
          {currentUser ? (
            <div className="flex items-center bg-emerald-900/60 dark:bg-slate-800/80 rounded-lg border border-emerald-700/50 dark:border-slate-700/70 p-0.5">
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-200">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[90px] truncate">{currentUser.username}</span>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1 hover:text-red-300 text-slate-300 rounded cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('register')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer border border-emerald-500/60"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Language Toggle */}
          <div className="flex items-center bg-emerald-900/60 dark:bg-slate-800/80 p-0.5 rounded-lg border border-emerald-700/50 dark:border-slate-700/70">
            <button
              onClick={() => onLanguageChange('en')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300 dark:text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              English
            </button>
            <button
              onClick={() => onLanguageChange('ta')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                language === 'ta'
                  ? 'bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300 dark:text-slate-400 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 bg-emerald-700/70 dark:bg-slate-800 text-emerald-100 dark:text-amber-300 hover:text-white hover:bg-emerald-600 dark:hover:bg-slate-700 rounded-lg border border-emerald-600/50 dark:border-slate-700 transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Admin Portal Button */}
          <button
            onClick={onOpenAdmin}
            title="Open Admin Portal"
            className="relative p-2 bg-emerald-700/70 dark:bg-slate-800 text-emerald-100 dark:text-emerald-300 hover:text-white hover:bg-emerald-600 dark:hover:bg-slate-700 rounded-lg border border-emerald-600/50 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1"
            aria-label="Admin Portal"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-semibold">Admin</span>
            {isAdminLoggedIn && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-800 dark:border-slate-900" />
            )}
          </button>

          {/* New Chat / Reset Memory Button */}
          <button
            onClick={onNewConsultation}
            disabled={isClearing}
            title={language === 'ta' ? 'புதிய ஆலோசனை (நினைவகத்தை மீட்டமை)' : 'New Consultation (Reset Memory)'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 dark:bg-emerald-900/90 hover:bg-emerald-600 dark:hover:bg-emerald-800 text-emerald-100 hover:text-white text-xs font-semibold rounded-lg border border-emerald-600/60 dark:border-emerald-700/60 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
            <span>{language === 'ta' ? 'புதிய ஆலோசனை' : 'New Chat'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-emerald-700/70 dark:border-slate-800 bg-emerald-900/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-xl">
          {/* Language Switcher Bar */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 dark:text-slate-400 mb-1.5">
              {language === 'ta' ? 'மொழி தேர்வு / Language' : 'Language Selection'}
            </div>
            <div className="grid grid-cols-2 gap-2 bg-emerald-950/60 dark:bg-slate-800/80 p-1 rounded-xl border border-emerald-700/50 dark:border-slate-700/70">
              <button
                onClick={() => {
                  onLanguageChange('en');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-200 dark:text-slate-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                English
              </button>
              <button
                onClick={() => {
                  onLanguageChange('ta');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  language === 'ta'
                    ? 'bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-200 dark:text-slate-400'
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>

          {/* Quick Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Theme Toggle */}
            <button
              onClick={() => {
                onToggleTheme();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-800/80 dark:bg-slate-800 text-emerald-100 hover:text-white rounded-xl border border-emerald-700/60 dark:border-slate-700 text-xs font-semibold cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-emerald-300" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* New Chat Button */}
            <button
              onClick={() => {
                onNewConsultation();
                setIsMobileMenuOpen(false);
              }}
              disabled={isClearing}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-700 dark:bg-emerald-800 text-white rounded-xl border border-emerald-600 text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
              <span>{language === 'ta' ? 'புதிய ஆலோசனை' : 'New Chat'}</span>
            </button>
          </div>

          {/* Consultation History (if logged in) & Admin Portal */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {currentUser && (
              <button
                onClick={() => {
                  onOpenHistory();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-800/80 dark:bg-slate-800 text-emerald-100 rounded-xl border border-emerald-700/60 text-xs font-semibold cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-300" />
                <span>Past History</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenAdmin();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 bg-emerald-800/80 dark:bg-slate-800 text-emerald-100 rounded-xl border border-emerald-700/60 text-xs font-semibold cursor-pointer ${
                !currentUser ? 'col-span-2' : ''
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Admin Portal</span>
              {isAdminLoggedIn && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>

          {/* Farmer Account Actions in Menu (Sign Out) */}
          {currentUser && (
            <div className="pt-2 border-t border-emerald-800/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Logged in as: <strong className="text-white">{currentUser.username}</strong></span>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-1 text-xs text-red-300 hover:text-red-100 font-semibold cursor-pointer px-2 py-1 bg-red-950/40 rounded-lg border border-red-800/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};


