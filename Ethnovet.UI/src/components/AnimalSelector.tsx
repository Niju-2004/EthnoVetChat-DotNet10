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
    <div className="bg-white border-b border-slate-200 py-2.5 px-4 shadow-xs">
      <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-medium text-slate-500 shrink-0">
          {language === 'ta' ? 'விலங்கு தேர்வு:' : 'Target Animal:'}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {animals.map((item) => {
            const isSelected = selectedAnimal === item.key;
            return (
              <button
                key={item.key ?? 'all'}
                onClick={() => onSelectAnimal(isSelected && item.key !== null ? null : item.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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

