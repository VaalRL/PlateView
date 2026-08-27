import React from 'react';
import { Link } from 'react-router-dom';
import { getPlayerHeadshotUrl, getTeamLogoUrl } from '../../services/mlbApi';
import { useLanguage } from '../../hooks/useLanguage';
import teamsData from '../../data/teams.json';
import { Flame, Shield, ArrowRight } from 'lucide-react';

interface FavoritePlayerSummaryCardProps {
  person: any;
  zhMeta?: { nameZh?: string; nameEn?: string };
  todayDateStr: string;
}

export const FavoritePlayerSummaryCard: React.FC<FavoritePlayerSummaryCardProps> = ({
  person,
  zhMeta,
  todayDateStr,
}) => {
  const { lang, t } = useLanguage();

  const playerName =
    lang === 'zh'
      ? zhMeta?.nameZh || person.fullName
      : person.fullName || zhMeta?.nameEn;

  const teamId = person.currentTeam?.id;
  const teamMeta = teamsData.find((t) => t.id === teamId);
  const teamName =
    lang === 'zh'
      ? teamMeta?.nameZh || person.currentTeam?.name || ''
      : teamMeta?.name || person.currentTeam?.name || '';

  // Extract gameLogs
  const hittingGroup = person.stats?.find(
    (s: any) => s.group?.displayName === 'hitting' && s.type?.displayName === 'gameLog'
  );
  const pitchingGroup = person.stats?.find(
    (s: any) => s.group?.displayName === 'pitching' && s.type?.displayName === 'gameLog'
  );

  const latestHitting = hittingGroup?.splits?.[hittingGroup.splits.length - 1];
  const latestPitching = pitchingGroup?.splits?.[pitchingGroup.splits.length - 1];

  // Determine primary active split (prioritize today's game)
  let activeSplit = latestHitting;
  let activeType: 'hitting' | 'pitching' = 'hitting';

  if (latestPitching && (!latestHitting || latestPitching.date >= (latestHitting?.date || ''))) {
    activeSplit = latestPitching;
    activeType = 'pitching';
  } else if (latestHitting) {
    activeSplit = latestHitting;
    activeType = 'hitting';
  }

  const isToday = activeSplit?.date === todayDateStr;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-team-primary/40 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Player Info */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to={`/players/${person.id}`}
              className="relative shrink-0 group-hover:scale-105 transition-transform"
            >
              <img
                src={getPlayerHeadshotUrl(person.id)}
                alt={playerName}
                className="w-11 h-11 rounded-full bg-page object-cover border border-border shadow-xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://img.mlbstatic.com/mlb-photos/image/upload/w_213,q_auto:best/v1/people/generic/headshot/67/current';
                }}
              />
              {person.primaryPosition?.abbreviation && (
                <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-main text-page font-mono text-[9px] font-bold rounded">
                  {person.primaryPosition.abbreviation}
                </span>
              )}
            </Link>

            <div className="min-w-0">
              <Link
                to={`/players/${person.id}`}
                className="text-sm font-bold text-main truncate hover:text-team-primary transition-colors block"
                title={playerName}
              >
                {playerName}
              </Link>
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                {teamId && (
                  <Link
                    to={`/teams/${teamId}`}
                    className="hover:text-team-primary flex items-center gap-1 transition-colors truncate"
                  >
                    <img
                      src={getTeamLogoUrl(teamId)}
                      alt={teamName}
                      className="w-3 h-3 object-contain shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="truncate">{teamName}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Date Badge */}
          {activeSplit ? (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 font-mono ${
                isToday
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : 'bg-page text-muted border border-border/50'
              }`}
            >
              {isToday
                ? t('fav.today_game').replace('{date}', activeSplit.date)
                : t('fav.latest_game').replace('{date}', activeSplit.date)}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-page text-muted border border-border/40 font-mono">
              {t('fav.no_game_today')}
            </span>
          )}
        </div>

        {/* Stats Summary Content */}
        <div className="pt-3 space-y-2.5">
          {activeSplit ? (
            <>
              {/* Highlight summary badge */}
              <div className="flex items-center gap-2">
                {activeType === 'hitting' ? (
                  <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <Shield className="w-4 h-4 text-team-primary shrink-0" />
                )}
                <span className="font-mono text-sm font-black text-main tracking-tight">
                  {activeSplit.stat.summary ||
                    (activeType === 'hitting'
                      ? `${activeSplit.stat.hits}-${activeSplit.stat.atBats}, ${activeSplit.stat.homeRuns} HR`
                      : `${activeSplit.stat.inningsPitched} IP, ${activeSplit.stat.strikeOuts} K, ${activeSplit.stat.earnedRuns} ER`)}
                </span>
              </div>

              {/* Stat breakdown pills */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono bg-page/60 p-2 rounded-xl border border-border/50">
                {activeType === 'hitting' ? (
                  <>
                    <div className="text-muted truncate">
                      <span>AVG: </span>
                      <strong className="text-main font-bold">
                        {activeSplit.stat.avg || '.---'}
                      </strong>
                    </div>
                    <div className="text-muted truncate">
                      <span>OPS: </span>
                      <strong className="text-emerald-500 font-bold">
                        {activeSplit.stat.ops || '.---'}
                      </strong>
                    </div>
                    <div className="text-muted truncate">
                      <span>HR: </span>
                      <strong className="text-main font-bold">
                        {activeSplit.stat.homeRuns ?? 0}
                      </strong>
                    </div>
                    <div className="text-muted truncate">
                      <span>RBI: </span>
                      <strong className="text-main font-bold">
                        {activeSplit.stat.rbi ?? 0}
                      </strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-muted truncate">
                      <span>ERA: </span>
                      <strong className="text-team-primary font-bold">
                        {activeSplit.stat.era || '-.--'}
                      </strong>
                    </div>
                    <div className="text-muted truncate">
                      <span>WHIP: </span>
                      <strong className="text-main font-bold">
                        {activeSplit.stat.whip || '-.--'}
                      </strong>
                    </div>
                    <div className="text-muted truncate">
                      <span>SO: </span>
                      <strong className="text-amber-500 font-bold">
                        {activeSplit.stat.strikeOuts ?? 0}
                      </strong>
                    </div>
                    <div className="text-muted truncate">
                      <span>BB: </span>
                      <strong className="text-main font-bold">
                        {activeSplit.stat.baseOnBalls ?? 0}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-xs text-muted">
              <span>{t('fav.no_game_today')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Link */}
      <div className="pt-2.5 mt-2 border-t border-border/30 flex justify-end">
        <Link
          to={`/players/${person.id}`}
          className="text-[11px] font-semibold text-muted group-hover:text-team-primary flex items-center gap-1 transition-colors"
        >
          <span>{t('leaders.view_player')}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
