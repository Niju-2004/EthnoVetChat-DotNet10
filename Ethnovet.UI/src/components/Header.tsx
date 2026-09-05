import React from 'react';
import { Leaf, RotateCcw, Globe, Sparkles, Sun, Moon, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  language: 'en' | 'ta';
  onLanguageChange: (lang: 'en' | 'ta') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  onNewConsultation: () => void;
  isClearing?: boolean;
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
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-800 dark:bg-slate-900 text-white shadow-md border-b border-emerald-700/50 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700/80 dark:bg-emerald-950/80 border border-emerald-500/30 dark:border-emerald-800/80 flex items-center justify-center shadow-inner">
            <Leaf className="w-6 h-6 text-emerald-300 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white m-0">EthnoVet Chat</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-700/80 dark:bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600/40 dark:border-emerald-700/50">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Gemini AI RAG
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 dark:text-slate-400 m-0">
              {language === 'ta'
                ? 'பாரம்பரிய மூலிகை கால்நடை மருத்துவ வழிகாட்டி'
                : 'Verified Traditional Ethnoveterinary Care for Farmers'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
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
            <span className="hidden sm:inline">
              {language === 'ta' ? 'புதிய ஆலோசனை' : 'New Chat'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

