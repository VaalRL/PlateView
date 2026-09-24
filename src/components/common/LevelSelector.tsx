import React from 'react';
import { BROWSABLE_LEVELS, type BrowsableLevel } from '../../constants/levels';
import { useLanguage } from '../../hooks/useLanguage';

interface LevelSelectorProps {
  value: BrowsableLevel;
  onChange: (level: BrowsableLevel) => void;
}

/** MLB / AAA / AA / A+ / A switcher; only the chosen level is ever fetched */
export const LevelSelector: React.FC<LevelSelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('home.level')}
      className="inline-flex items-center p-1 bg-card border border-border rounded-xl text-xs font-semibold max-w-full overflow-x-auto"
    >
      {BROWSABLE_LEVELS.map((level) => (
        <button
          key={level.id}
          onClick={() => onChange(level)}
          aria-pressed={value.id === level.id}
          className={`px-3 py-1 rounded-lg transition-colors shrink-0 ${
            value.id === level.id ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
          }`}
        >
          {level.abbreviation}
        </button>
      ))}
    </div>
  );
};
