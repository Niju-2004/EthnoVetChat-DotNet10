import React from 'react';
import { Leaf, RotateCcw, Globe, Sparkles } from 'lucide-react';

interface HeaderProps {
  language: 'en' | 'ta';
  onLanguageChange: (lang: 'en' | 'ta') => void;
  onNewConsultation: () => void;
  isClearing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  onNewConsultation,
  isClearing = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center shadow-inner">
            <Leaf className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white m-0">EthnoVet Chat</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-700/80 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600/40">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Gemini AI RAG
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 m-0">
              {language === 'ta'
                ? 'பாரம்பரிய மூலிகை கால்நடை மருத்துவ வழிகாட்டி'
                : 'Verified Traditional Ethnoveterinary Care for Farmers'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <div className="flex items-center bg-emerald-900/60 p-0.5 rounded-lg border border-emerald-700/50">
            <button
              onClick={() => onLanguageChange('en')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                language === 'en'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              English
            </button>
            <button
              onClick={() => onLanguageChange('ta')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                language === 'ta'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* New Chat / Free Memory Button */}
          <button
            onClick={onNewConsultation}
            disabled={isClearing}
            title={language === 'ta' ? 'புதிய ஆலோசனை (நினைவகத்தை மீட்டமை)' : 'New Consultation (Reset Memory)'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-emerald-100 hover:text-white text-xs font-semibold rounded-lg border border-emerald-600/60 shadow-sm transition-all disabled:opacity-50"
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

