import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import { useLanguage } from '../../hooks/useLanguage';
import { GameSchedule } from '../../types/mlb';
import teamsData from '../../data/teams.json';
import playersData from '../../data/players-zh-tw.json';

interface FavoritesBarProps {
  games?: GameSchedule[];
}

export const FavoritesBar: React.FC<FavoritesBarProps> = ({ games = [] }) => {
  const { favoriteTeams, favoritePlayers } = useFavorites();
  const { lang, t } = useLanguage();

  const favTeams = teamsData.filter((t) => favoriteTeams.includes(t.id));
  const favPlayers = playersData.filter((p) => favoritePlayers.includes(p.id));

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
    <div className="mb-6 bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 shrink-0">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>{t('fav.title')}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
                  <span className="text-[10px] text-muted font-mono bg-card px-1.5 py-0.2 rounded border border-border/50">
                    {gameSummary}
                  </span>
                )}
              </Link>
            );
          })}

          {favPlayers.map((player) => {
            const isStarting = isPlayerStartingToday(player.id);
            const playerDisplayName = lang === 'zh' ? player.nameZh : player.nameEn;

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
    </div>
  );
};
