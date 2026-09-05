import React, { useState } from 'react';
import type { ChatMessage } from '../types';
import { RemedyCard } from './RemedyCard';
import { Bot, User, Copy, Check, Sparkles, AlertTriangle } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  language: 'en' | 'ta';
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, language }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple clean markdown-like line formatting
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-emerald-950 dark:text-emerald-300 mt-3 mb-1 first:mt-0">
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-base font-bold text-emerald-950 dark:text-emerald-300 mt-3 mb-1 first:mt-0">
            {trimmed.replace('## ', '')}
          </h2>
        );
      }

      // Safety Alert Callout
      if (trimmed.includes('⚠️') || trimmed.toLowerCase().includes('veterinarian') || trimmed.includes('கால்நடை மருத்துவர்')) {
        return (
          <div
            key={idx}
            className="my-2 p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/70 rounded-lg flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>{trimmed.replace(/^[⚠️*_\s]+|[#*_\s]+$/g, '')}</span>
          </div>
        );
      }

      // Bullet points
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 dark:text-slate-300 leading-relaxed my-0.5">
            {renderFormattedInline(trimmed.substring(2))}
          </li>
        );
      }

      // Numbered items
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-700 dark:text-slate-300 leading-relaxed my-0.5">
            {renderFormattedInline(trimmed.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }

      // Empty lines
      if (trimmed === '') {
        return <div key={idx} className="h-1.5" />;
      }

      // Standard paragraphs
      return (
        <p key={idx} className="text-slate-800 dark:text-slate-200 leading-relaxed my-1">
          {renderFormattedInline(trimmed)}
        </p>
      );
    });
  };

  // Helper for bold formatting (**text**)
  const renderFormattedInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar (Assistant) */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-2.5 ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm shadow-xs ${
            isUser
              ? 'bg-emerald-700 dark:bg-emerald-600 text-white rounded-tr-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
          }`}
        >
          {/* Assistant Header Actions */}
          {!isUser && (
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <Sparkles className="w-3 h-3 text-amber-500" />
                EthnoVet AI
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded-sm cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Formatted Content */}
          <div className="text-xs sm:text-sm">{formatContent(message.content)}</div>
        </div>

        {/* Relevant Remedies Cards (Under Assistant Message) */}
        {!isUser && message.relevantRemedies && message.relevantRemedies.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              <span>{language === 'ta' ? 'ஆதார பாரம்பரிய முறைகள் (RAG Source):' : 'Verified RAG Knowledge:'}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {message.relevantRemedies.map((remedy) => (
                <RemedyCard key={remedy.id} remedy={remedy} language={language} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Avatar (User) */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-700 dark:bg-slate-800 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 border border-slate-600 dark:border-slate-700">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

