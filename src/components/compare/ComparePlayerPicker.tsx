import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { usePeopleSearchQuery } from '../../services/queries';
import { useLanguage } from '../../hooks/useLanguage';
import playersData from '../../data/players-zh-tw.json';

interface Props {
  selected: number[];
  full: boolean;
  onAdd: (id: number) => void;
}

/**
 * Search box for the comparison page: the Chinese name dictionary first (so
 * 大谷 or 李灝宇 work), then the MLB player search for everyone else.
 */
export const ComparePlayerPicker: React.FC<Props> = ({ selected, full, onAdd }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const { data: online } = usePeopleSearchQuery(query);

  const results = useMemo(() => {
    if (!q) return [];
    const local = playersData
      .filter(
        (p) =>
          p.nameEn.toLowerCase().includes(q) || p.nameZh.includes(q) || p.nicknames.some((n) => n.toLowerCase().includes(q))
      )
      .map((p) => ({ id: p.id, name: p.nameEn }));
    const seen = new Set(local.map((p) => p.id));
    const remote = ((online?.people ?? []) as { id: number; fullName: string }[])
      .filter((p) => !seen.has(p.id))
      .map((p) => ({ id: p.id, name: p.fullName }));
    return [...local, ...remote].filter((p) => !selected.includes(p.id)).slice(0, 8);
  }, [q, online, selected]);

  const add = (id: number) => {
    onAdd(id);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-md">
      <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:border-team-primary">
        <Search className="w-4 h-4 text-muted shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={full}
          placeholder={full ? t('compare.full') : t('compare.add_placeholder')}
          aria-label={t('compare.add_placeholder')}
          className="flex-1 min-w-0 bg-transparent text-sm text-main placeholder:text-muted focus:outline-none disabled:cursor-not-allowed"
        />
      </label>
      {results.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => add(p.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-card-hover"
              >
                <span className="truncate font-semibold text-main">{p.name}</span>
                <Plus className="w-4 h-4 text-team-primary shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
