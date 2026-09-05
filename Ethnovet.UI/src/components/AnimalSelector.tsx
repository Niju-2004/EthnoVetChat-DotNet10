import React from 'react';

interface AnimalSelectorProps {
  selectedAnimal: string | null;
  onSelectAnimal: (animal: string | null) => void;
  language: 'en' | 'ta';
}

interface AnimalOption {
  key: string | null;
  labelEn: string;
  labelTa: string;
  icon: string;
}

const animals: AnimalOption[] = [
  { key: null, labelEn: 'All Animals', labelTa: 'அனைத்தும்', icon: '🐾' },
  { key: 'cow', labelEn: 'Cow / Cattle', labelTa: 'பசு / மாடு', icon: '🐄' },
  { key: 'goat', labelEn: 'Goat / Sheep', labelTa: 'ஆடு', icon: '🐐' },
  { key: 'poultry', labelEn: 'Poultry / Chicken', labelTa: 'கோழி', icon: '🐔' },
  { key: 'dog', labelEn: 'Dog', labelTa: 'நாய்', icon: '🐕' },
];

export const AnimalSelector: React.FC<AnimalSelectorProps> = ({
  selectedAnimal,
  onSelectAnimal,
  language,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-2.5 px-4 shadow-xs transition-colors duration-200">
      <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
          {language === 'ta' ? 'விலங்கு தேர்வு:' : 'Target Animal:'}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {animals.map((item) => {
            const isSelected = selectedAnimal === item.key;
            return (
              <button
                key={item.key ?? 'all'}
                onClick={() => onSelectAnimal(isSelected && item.key !== null ? null : item.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{language === 'ta' ? item.labelTa : item.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

