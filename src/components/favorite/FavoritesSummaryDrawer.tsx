import React from 'react';
import { useFavoritePlayersGameLogQuery } from '../../services/queries';
import { useLanguage } from '../../hooks/useLanguage';
import { useFavorites } from '../../hooks/useFavorites';
import { FavoritePlayerSummaryCard } from './FavoritePlayerSummaryCard';
import playersData from '../../data/players-zh-tw.json';
import { Sparkles, RefreshCw } from 'lucide-react';

interface FavoritesSummaryDrawerProps {
  playerIds: number[];
  todayDateStr: string;
}

export const FavoritesSummaryDrawer: React.FC<FavoritesSummaryDrawerProps> = ({
  playerIds,
  todayDateStr,
}) => {
  const { t } = useLanguage();
  const { favoritePlayersMeta } = useFavorites();

  const { data, isLoading, isFetching, refetch } = useFavoritePlayersGameLogQuery(playerIds);
  const people = data?.people || [];

  return (
    <div className="mt-3 pt-3 border-t border-border/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Sub Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-xs text-main tracking-tight">
            {t('fav.summary_title')}
          </h3>
          <span className="text-[11px] text-muted hidden sm:inline">
            &bull; {t('fav.summary_subtitle')}
          </span>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-team-primary transition-colors disabled:opacity-50"
          title={t('sb.refresh')}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('sb.refresh')}</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {playerIds.map((id) => (
            <div
              key={id}
              className="bg-card/60 border border-border rounded-2xl p-4 h-40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Cards Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {people.map((person: any) => {
            const localMeta = playersData.find((p) => p.id === person.id);
            const cachedMeta = favoritePlayersMeta[person.id];
            const zhMeta = localMeta || cachedMeta;

            return (
              <FavoritePlayerSummaryCard
                key={person.id}
                person={person}
                zhMeta={zhMeta}
                todayDateStr={todayDateStr}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
