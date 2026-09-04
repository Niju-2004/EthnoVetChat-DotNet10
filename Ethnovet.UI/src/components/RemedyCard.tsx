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
    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 shadow-xs hover:border-emerald-300 transition-all text-left">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 m-0 leading-tight">
              {remedy.disease}
            </h4>
            <span className="text-[11px] text-emerald-700 font-medium">
              {remedy.animal ? `(${remedy.animal})` : ''}
            </span>
          </div>
        </div>

        <button
          className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md"
          aria-label="Toggle details"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-2.5 border-t border-emerald-200/60 space-y-2.5 text-xs">
          {remedy.symptoms && (
            <div>
              <span className="font-semibold text-slate-700">
                {language === 'ta' ? 'அறிகுறிகள்:' : 'Symptoms:'}
              </span>
              <p className="text-slate-600 mt-0.5 m-0 leading-relaxed">{remedy.symptoms}</p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1 font-semibold text-emerald-800 mb-0.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'ta' ? 'தேவையான மூலிகைகள்:' : 'Herbal Ingredients:'}</span>
            </div>
            <p className="text-slate-700 bg-white/80 p-2 rounded-md border border-emerald-100 m-0 leading-relaxed">
              {remedy.ingredients}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 font-semibold text-emerald-800 mb-0.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'ta' ? 'தயாரிப்பு மற்றும் சிகிச்சை முறை:' : 'Treatment & Preparation:'}</span>
            </div>
            <p className="text-slate-700 whitespace-pre-line bg-white/80 p-2 rounded-md border border-emerald-100 m-0 leading-relaxed">
              {remedy.treatment}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
