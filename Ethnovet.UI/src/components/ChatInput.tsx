import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  language: 'en' | 'ta';
  selectedAnimal: string | null;
}

const suggestionsEn = [
  'Cow bloat and breathing trouble',
  'Goat with watery dung / diarrhea',
  'Chicken wounds and pecking injuries',
  'How to increase milk yield?',
];

const suggestionsTa = [
  'மாட்டுக்கு வயிறு உப்பசம்',
  'ஆட்டுக்கு கழிச்சல் / பேதி',
  'கோழிக்கு காயம் மற்றும் புண்',
  'மாட்டுக்கு பால் பெருக்க மருந்து',
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  language,
  selectedAnimal,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API for voice input (English / Tamil)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        language === 'ta'
          ? 'உங்கள் உலாவியில் குரல் அறிதல் ஆதரிக்கப்படவில்லை.'
          : 'Speech recognition is not supported in this browser.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-expand textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 250);
  };

  const currentSuggestions = language === 'ta' ? suggestionsTa : suggestionsEn;

  return (
    <div className="w-full pt-1.5 pb-2 sm:pb-3 px-2.5 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-1.5 sm:space-y-2">
        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth touch-pan-x">
          {currentSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(suggestion)}
              disabled={isLoading}
              className="shrink-0 text-[11px] sm:text-xs font-medium bg-white/95 dark:bg-slate-900/95 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-full px-2.5 sm:px-3 py-1 transition-all shadow-2xs disabled:opacity-50 cursor-pointer active:scale-95 select-none"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-300 dark:border-slate-700 shadow-md p-1.5 sm:p-2 flex items-end gap-1.5 sm:gap-2 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : 'Speak your query'}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Textarea: text-base on mobile prevents iOS Safari automatic viewport zoom */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={
              language === 'ta'
                ? selectedAnimal
                  ? `${selectedAnimal} பற்றிய உங்கள் கேள்வியை எழுதுங்கள்...`
                  : 'கால்நடை அறிகுறிகள் அல்லது நோய் பற்றி கேளுங்கள்...'
                : selectedAnimal
                ? `Ask about ${selectedAnimal} symptoms or remedies...`
                : 'Describe livestock symptoms or ask for herbal remedy...'
            }
            className="flex-1 max-h-24 sm:max-h-28 py-1.5 sm:py-2 px-1 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent resize-none focus:outline-hidden leading-relaxed"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white disabled:opacity-40 disabled:hover:bg-emerald-600 transition-all shadow-xs cursor-pointer shrink-0 flex items-center justify-center active:scale-95"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Listening Indicator Note */}
        {isListening && (
          <div className="text-center text-xs font-semibold text-red-600 dark:text-red-400 animate-pulse py-0.5">
            ● {language === 'ta' ? 'கேட்கிறது... தமிழில் பேசுங்கள்' : 'Listening... Speak now'}
          </div>
        )}
      </div>
    </div>
  );
};

