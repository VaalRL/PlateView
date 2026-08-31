import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import { useLanguage } from '../../hooks/useLanguage';
import { usePeopleBatchQuery } from '../../services/queries';
import { GameSchedule } from '../../types/mlb';
import teamsData from '../../data/teams.json';
import playersData from '../../data/players-zh-tw.json';
import { FavoritesBackupModal } from './FavoritesBackupModal';
import { FavoritesSummaryDrawer } from './FavoritesSummaryDrawer';
import { getEasternDateStr } from '../../utils/timezone';

interface FavoritesBarProps {
  games?: GameSchedule[];
  currentDate?: string;
}

export const FavoritesBar: React.FC<FavoritesBarProps> = ({ games = [], currentDate }) => {
  const { favoriteTeams, favoritePlayers, favoritePlayersMeta } = useFavorites();
  const { lang, t } = useLanguage();
  const [showSummary, setShowSummary] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // MLB gameLog dates are US-based, so "today" must be the Eastern date
  const todayDateStr = currentDate || getEasternDateStr();

  const favTeams = teamsData.filter((t) => favoriteTeams.includes(t.id));

  // Determine which favorited player IDs are not found in the static seed json or local meta
  const unseededIds = favoritePlayers.filter(
    (id) => !playersData.some((p) => p.id === id) && !favoritePlayersMeta[id]?.nameEn
  );

  const { data: batchPeopleData } = usePeopleBatchQuery(unseededIds);

  // Construct full list of favorite players ensuring EVERY favorite player is
  // rendered. Display names are always English for cross-list consistency.
  const favPlayers = favoritePlayers.map((id) => {
    const local = playersData.find((p) => p.id === id);
    if (local) {
      return { id, nameEn: local.nameEn };
    }

    const cached = favoritePlayersMeta[id];
    if (cached?.nameEn) {
      return { id, nameEn: cached.nameEn };
    }

    const remote = batchPeopleData?.people?.find((p) => p.id === id);
    if (remote) {
      return { id, nameEn: remote.fullName };
    }

    // Chinese-only meta: show it until the batch API supplies the English name
    if (cached?.nameZh) {
      return { id, nameEn: cached.nameZh };
    }

    return { id, nameEn: `Player #${id}` };
  });

  if (favTeams.length === 0 && favPlayers.length === 0) {
    return null;
  }

  // Find game for a team
  const getTeamGameSummary = (teamId: number) => {
    const game = games.find(
      (g) => g.teams.away.team.id === teamId || g.teams.home.team.id === teamId
    );
    if (!game) return null;

    const isAway = game.teams.away.team.id === teamId;
    const oppTeam = isAway ? game.teams.home.team : game.teams.away.team;
    const oppMeta = teamsData.find((t) => t.id === oppTeam.id);
    const oppAbbrev = oppMeta?.abbrev || oppTeam.name.slice(0, 3).toUpperCase();

    if (game.status.abstractGameState === 'Live') {
      const myScore = isAway ? game.teams.away.score : game.teams.home.score;
      const oppScore = isAway ? game.teams.home.score : game.teams.away.score;
      return `🔴 ${myScore}-${oppScore} ${t('fav.live_vs')} ${oppAbbrev}`;
    }
    if (game.status.abstractGameState === 'Final') {
      const myScore = isAway ? game.teams.away.score : game.teams.home.score;
      const oppScore = isAway ? game.teams.home.score : game.teams.away.score;
      return `${t('fav.final_vs')} ${myScore}-${oppScore} ${t('fav.live_vs')} ${oppAbbrev}`;
    }
    return `${t('fav.live_vs')} ${oppAbbrev}`;
  };

  // Check if a player is starting pitcher today
  const isPlayerStartingToday = (playerId: number) => {
    return games.some(
      (g) =>
        g.teams.away.probablePitcher?.id === playerId ||
        g.teams.home.probablePitcher?.id === playerId
    );
  };

  return (
    <>
      <div className="mb-6 bg-card border border-border rounded-2xl p-3 shadow-sm transition-all">
        {/* Main Bar Top Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Star Title & Tag List */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 shrink-0">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{t('fav.title')}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {favTeams.map((team) => {
                const gameSummary = getTeamGameSummary(team.id);
                const teamDisplayName = lang === 'zh' ? team.nameZh : team.name;

                return (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-page border border-border text-xs font-medium hover:border-team-primary transition-all group"
                  >
                    <span
                      className="w-2 h-2 rounded-full group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: team.primaryColor }}
                    />
                    <span className="font-semibold text-main">{teamDisplayName}</span>
                    {gameSummary && (
                      <span className="text-[10px] text-muted font-mono bg-card px-1.5 py-0.5 rounded border border-border/50">
                        {gameSummary}
                      </span>
                    )}
                  </Link>
                );
              })}

              {favPlayers.map((player) => {
                const isStarting = isPlayerStartingToday(player.id);
                const playerDisplayName = player.nameEn;

                return (
                  <Link
                    key={player.id}
                    to={`/players/${player.id}`}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      isStarting
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                        : 'bg-team-primary/10 border-team-primary/20 text-team-primary hover:bg-team-primary/20'
                    }`}
                  >
                    <span>⭐ {playerDisplayName}</span>
                    {isStarting && (
                      <span className="text-[10px] bg-amber-500 text-black px-1 rounded font-bold">
                        {t('fav.today_starter')}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Actions (Summary Drawer Toggle & Backup Modal Trigger) */}
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/30 shrink-0">
            {favoritePlayers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSummary((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                  showSummary
                    ? 'bg-team-primary text-white border-team-primary shadow-xs'
                    : 'bg-page text-muted hover:text-main border-border hover:border-team-primary/50'
                }`}
                title={showSummary ? t('fav.hide_summary') : t('fav.toggle_summary')}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{showSummary ? t('fav.hide_summary') : t('fav.toggle_summary')}</span>
                {showSummary ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsBackupOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-muted hover:text-main bg-page border border-border hover:border-team-primary/50 transition-colors"
              title={t('fav.backup_btn')}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('fav.backup_btn')}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Today's Summary Drawer */}
        {showSummary && favoritePlayers.length > 0 && (
          <FavoritesSummaryDrawer
            playerIds={favoritePlayers}
            todayDateStr={todayDateStr}
          />
        )}
      </div>

      {/* Backup & Restore Modal */}
      <FavoritesBackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />
    </>
  );
};
