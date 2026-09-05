import React, { useState } from 'react';
import type { Remedy } from '../types';
import { ChevronDown, ChevronUp, Leaf, FlaskConical, Stethoscope } from 'lucide-react';

interface RemedyCardProps {
  remedy: Remedy;
  language: 'en' | 'ta';
}

export const RemedyCard: React.FC<RemedyCardProps> = ({ remedy, language }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-3 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-left">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 m-0 leading-tight">
              {remedy.disease}
            </h4>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              {remedy.animal ? `(${remedy.animal})` : ''}
            </span>
          </div>
        </div>

        <button
          className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 p-1 rounded-md cursor-pointer"
          aria-label="Toggle details"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/60 space-y-2.5 text-xs">
          {remedy.symptoms && (
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ta' ? 'அறிகுறிகள்:' : 'Symptoms:'}
              </span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5 m-0 leading-relaxed">{remedy.symptoms}</p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300 mb-0.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'ta' ? 'தேவையான மூலிகைகள்:' : 'Herbal Ingredients:'}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2 rounded-md border border-emerald-100 dark:border-emerald-900/60 m-0 leading-relaxed">
              {remedy.ingredients}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300 mb-0.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'ta' ? 'தயாரிப்பு மற்றும் சிகிச்சை முறை:' : 'Treatment & Preparation:'}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line bg-white/80 dark:bg-slate-900/80 p-2 rounded-md border border-emerald-100 dark:border-emerald-900/60 m-0 leading-relaxed">
              {remedy.treatment}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

