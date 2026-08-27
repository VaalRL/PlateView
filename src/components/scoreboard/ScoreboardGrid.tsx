import React from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { ScoreboardCard } from './ScoreboardCard';
import { useScheduleQuery } from '../../services/queries';
import { formatApiDate } from '../../utils/timezone';
import { useLanguage } from '../../hooks/useLanguage';

interface ScoreboardGridProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const ScoreboardGrid: React.FC<ScoreboardGridProps> = ({ selectedDate, onDateChange }) => {
  const dateStr = formatApiDate(selectedDate);
  const { data, isLoading, isError, refetch, isFetching } = useScheduleQuery(dateStr, true);
  const { lang, t } = useLanguage();

  const games = data?.dates?.[0]?.games || [];

  const formattedDateString =
    lang === 'zh'
      ? format(selectedDate, 'yyyy 年 MM 月 dd 日')
      : format(selectedDate, 'MMM dd, yyyy');

  return (
    <section className="space-y-4">
      {/* Date Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDateChange(subDays(selectedDate, 1))}
            className="p-1.5 rounded-lg border border-border hover:bg-card-hover text-muted hover:text-main transition-colors"
            title={t('sb.prev_day')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDateChange(new Date())}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-page border border-border hover:border-team-primary text-main transition-colors"
          >
            {t('sb.today')}
          </button>

          <button
            onClick={() => onDateChange(addDays(selectedDate, 1))}
            className="p-1.5 rounded-lg border border-border hover:bg-card-hover text-muted hover:text-main transition-colors"
            title={t('sb.next_day')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={dateStr}
            onChange={(e) => {
              if (e.target.value) {
                const parts = e.target.value.split('-').map(Number);
                onDateChange(new Date(parts[0], parts[1] - 1, parts[2]));
              }
            }}
            className="text-xs bg-page border border-border text-main rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-team-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted font-medium">
            {formattedDateString} ({t('sb.games_count', { count: games.length })})
          </span>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg border border-border hover:bg-card-hover text-muted hover:text-main disabled:opacity-50 transition-colors"
            title={t('sb.refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-team-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-36 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl p-6 text-center text-sm">
          {t('sb.error')}
          <button
            onClick={() => refetch()}
            className="block mx-auto mt-3 px-4 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-semibold"
          >
            {t('sb.retry')}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && games.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted">
          <p className="text-base font-semibold text-main">{t('sb.no_games')}</p>
          <p className="text-xs mt-1">{t('sb.no_games_hint')}</p>
        </div>
      )}

      {/* Games Grid */}
      {!isLoading && !isError && games.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <ScoreboardCard key={game.gamePk} game={game} />
          ))}
        </div>
      )}
    </section>
  );
};
