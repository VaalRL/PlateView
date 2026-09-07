import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFavoritePlayersGameLogQuery, useScheduleQuery } from '../../services/queries';
import { getPreviousDateStr } from '../../utils/timezone';
import { useLanguage } from '../../hooks/useLanguage';
import { useFavorites } from '../../hooks/useFavorites';
import { FavoritePlayerSummaryCard } from './FavoritePlayerSummaryCard';
import { FavoriteTeamSummaryCard } from './FavoriteTeamSummaryCard';
import { GameSchedule } from '../../types/mlb';
import playersData from '../../data/players-zh-tw.json';
import { Sparkles, RefreshCw } from 'lucide-react';

interface FavoritesSummaryDrawerProps {
  teamIds: number[];
  playerIds: number[];
  games: GameSchedule[];
  todayDateStr: string;
}

export const FavoritesSummaryDrawer: React.FC<FavoritesSummaryDrawerProps> = ({
  teamIds,
  playerIds,
  games,
  todayDateStr,
}) => {
  const { t } = useLanguage();
  const { favoritePlayersMeta } = useFavorites();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useFavoritePlayersGameLogQuery(playerIds);
  const people = data?.people || [];

  // Team cards pair the summarized day with the one before it. The base date is
  // taken from the games themselves so both rows always belong to the same day.
  const baseDateStr = games[0]?.officialDate || todayDateStr;
  const { data: previousData } = useScheduleQuery(
    getPreviousDateStr(baseDateStr),
    teamIds.length > 0
  );
  const previousGames = previousData?.dates?.[0]?.games || [];

  const findTeamGame = (list: GameSchedule[], teamId: number) =>
    list.find((g) => g.teams.away.team.id === teamId || g.teams.home.team.id === teamId);

  // Team cards are fed by the schedule query owned by the page, so a manual
  // refresh has to invalidate it as well as the player game logs
  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['schedule'] });
  };

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
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-team-primary transition-colors disabled:opacity-50"
          title={t('sb.refresh')}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('sb.refresh')}</span>
        </button>
      </div>

      {/* Cards Grid: favorite teams first, then favorite players */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {teamIds.map((teamId) => (
          <FavoriteTeamSummaryCard
            key={`team-${teamId}`}
            teamId={teamId}
            game={findTeamGame(games, teamId)}
            previousGame={findTeamGame(previousGames, teamId)}
          />
        ))}

        {isLoading
          ? playerIds.map((id) => (
              <div
                key={`skeleton-${id}`}
                className="bg-card/60 border border-border rounded-2xl p-4 h-40 animate-pulse"
              />
            ))
          : people.map((person) => {
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
    </div>
  );
};
