import React from 'react';
import { Link } from 'react-router-dom';
import { LeaderCategoryGroup, LeaderItem } from '../../types/leaderboards';
import { getPlayerHeadshotUrl, getTeamLogoUrl } from '../../services/mlbApi';
import { useLanguage } from '../../hooks/useLanguage';
import playersData from '../../data/players-zh-tw.json';
import teamsData from '../../data/teams.json';
import { Trophy } from 'lucide-react';

interface LeaderCardProps {
  categoryGroup: LeaderCategoryGroup;
  title: string;
  unit?: string;
  icon?: React.ReactNode;
}

export const LeaderCard: React.FC<LeaderCardProps> = ({
  categoryGroup,
  title,
  unit,
  icon,
}) => {
  const { lang, t } = useLanguage();
  const leaders = categoryGroup.leaders || [];

  if (leaders.length === 0) {
    return null;
  }

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-black';
      case 2:
        return 'bg-slate-400/20 text-slate-200 border-slate-400/30 font-bold';
      case 3:
        return 'bg-amber-700/20 text-amber-500 border-amber-700/30 font-bold';
      default:
        return 'bg-page text-muted border-border/50 font-medium';
    }
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-team-primary/40 transition-all flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            {icon || <Trophy className="w-4 h-4 text-amber-400" />}
            <h3 className="font-bold text-sm text-main tracking-tight">{title}</h3>
          </div>
          {unit && <span className="text-[11px] font-mono text-muted">{unit}</span>}
        </div>

        {/* Leaders List */}
        <div className="divide-y divide-border/30 mt-1">
          {leaders.map((leader: LeaderItem, index: number) => {
            const zhMeta = playersData.find((p) => p.id === leader.person.id);
            const teamMeta = teamsData.find((t) => t.id === leader.team.id);

            const playerName =
              lang === 'zh'
                ? zhMeta?.nameZh || leader.person.fullName
                : leader.person.fullName;

            const teamName =
              lang === 'zh'
                ? teamMeta?.nameZh || leader.team.name
                : teamMeta?.abbrev || leader.team.name;

            const isLeader = leader.rank === 1;

            return (
              <div
                key={`${leader.person.id}-${index}`}
                className={`py-2.5 flex items-center justify-between gap-3 group/item transition-colors rounded-lg px-1.5 -mx-1.5 ${
                  isLeader ? 'bg-amber-500/5' : 'hover:bg-card-hover/50'
                }`}
              >
                {/* Left: Rank & Avatar & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rank Badge */}
                  <span
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs shrink-0 font-mono ${getRankBadgeClass(
                      leader.rank
                    )}`}
                  >
                    {getRankMedal(leader.rank)}
                  </span>

                  {/* Player Headshot */}
                  <Link
                    to={`/players/${leader.person.id}`}
                    className="relative shrink-0 group/avatar"
                    title={playerName}
                  >
                    <img
                      src={getPlayerHeadshotUrl(leader.person.id)}
                      alt={playerName}
                      className="w-8 h-8 rounded-full bg-page object-cover border border-border/80 group-hover/avatar:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://img.mlbstatic.com/mlb-photos/image/upload/w_213,q_auto:best/v1/people/generic/headshot/67/current';
                      }}
                    />
                  </Link>

                  {/* Player and Team Info */}
                  <div className="min-w-0 flex flex-col">
                    <Link
                      to={`/players/${leader.person.id}`}
                      className="text-xs font-bold text-main truncate hover:text-team-primary transition-colors flex items-center gap-1"
                      title={playerName}
                    >
                      <span className="truncate">{playerName}</span>
                    </Link>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted">
                      {teamMeta ? (
                        <Link
                          to={`/teams/${teamMeta.id}`}
                          className="hover:text-team-primary flex items-center gap-1 transition-colors"
                        >
                          <img
                            src={getTeamLogoUrl(teamMeta.id)}
                            alt={teamMeta.name}
                            className="w-3 h-3 object-contain shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span>{teamName}</span>
                        </Link>
                      ) : (
                        <span>{teamName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Stat Value */}
                <div className="text-right shrink-0">
                  <span
                    className={`font-mono text-sm tracking-tight ${
                      isLeader
                        ? 'font-black text-team-primary text-base'
                        : 'font-bold text-main'
                    }`}
                  >
                    {leader.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer hint */}
      <div className="pt-2 mt-2 border-t border-border/20 text-right">
        <Link
          to={`/players/${leaders[0]?.person.id}`}
          className="text-[11px] text-muted hover:text-team-primary transition-colors font-medium"
        >
          {t('leaders.view_player')} &rarr;
        </Link>
      </div>
    </div>
  );
};
