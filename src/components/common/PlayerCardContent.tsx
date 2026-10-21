import React from 'react';
import { useLeaderboardsQuery, usePersonSummaryQuery, useTeamDetailQuery } from '../../services/queries';
import { getPlayerHeadshotUrl } from '../../services/mlbApi';
import { useLanguage } from '../../hooks/useLanguage';
import { teamDisplayName } from '../../utils/teams';
import type { TranslationKey } from '../../i18n/translations';
import { HITTING_LEADER_CATEGORIES, PITCHING_LEADER_CATEGORIES } from '../../constants/leaderboards';
import { getCurrentMlbSeason } from '../../utils/season';
import { findLeaderRanks, isMinorLeagueClub, levelAbbreviation, ordinal } from '../../utils/hoverCards';

/** Leader categories listed on the card at most */
const MAX_RANKS = 4;

/** Exactly the leaderboard page's default (MLB-wide, top 5), so the two share a cache */
const leaderParams = (statGroup: 'hitting' | 'pitching') => ({
  statGroup,
  categories: [...(statGroup === 'hitting' ? HITTING_LEADER_CATEGORIES : PITCHING_LEADER_CATEGORIES)],
  leagueId: undefined,
  season: getCurrentMlbSeason(),
  limit: 5,
});

/** Card body for PlayerHoverCard; a module of its own so it loads on first hover */
const PlayerCardContent: React.FC<{ personId: number }> = ({ personId }) => {
  const { lang, t } = useLanguage();
  const { data, isLoading } = usePersonSummaryQuery(personId);
  const person = data?.people?.[0];
  const team = person?.currentTeam;
  const isMinors = isMinorLeagueClub(team?.id);
  // The leaderboards are MLB only: no point asking for a minor leaguer or a
  // player without a club
  const onMlbClub = !!team && !isMinors;
  const hitting = useLeaderboardsQuery(leaderParams('hitting'), onMlbClub);
  const pitching = useLeaderboardsQuery(leaderParams('pitching'), onMlbClub);

  // The person's currentTeam names the club and its parent but not its level
  // (checked against the live API), so a minor league club's level comes from
  // its own record: the query the team page and team card use
  const { data: club } = useTeamDetailQuery(isMinors ? team?.id : undefined);
  const level = isMinors ? levelAbbreviation(team?.sport?.id ?? club?.teams?.[0]?.sport?.id) : undefined;

  const teamName = teamDisplayName(team?.id, lang, team?.name);
  const parentName = teamDisplayName(team?.parentOrgId, lang, team?.parentOrgName);

  const ranks = onMlbClub
    ? findLeaderRanks(personId, [
        ...(hitting.data?.leagueLeaders ?? []),
        ...(pitching.data?.leagueLeaders ?? []),
      ]).slice(0, MAX_RANKS)
    : [];

  return (
    <>
      <div className="flex items-center gap-2.5">
        <img
          src={getPlayerHeadshotUrl(personId)}
          alt=""
          className="w-10 h-10 rounded-full bg-page object-cover border border-border shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.visibility = 'hidden';
          }}
        />
        <div className="min-w-0">
          <div className="font-bold text-sm truncate">
            {person?.fullName ?? (isLoading ? '…' : '')}
            {person?.primaryPosition?.abbreviation && (
              <span className="ml-1.5 font-mono text-[10px] text-muted">{person.primaryPosition.abbreviation}</span>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-2 h-4 rounded bg-page animate-pulse" />
      ) : (
        teamName && (
          <div className="mt-2.5 rounded-lg bg-page px-2.5 py-2 space-y-0.5">
            <div className="font-semibold">
              {level && (
                <span className="mr-1.5 px-1 rounded bg-amber-500/15 text-amber-500 text-[9px] font-bold">
                  {level}
                </span>
              )}
              {teamName}
            </div>
            {isMinors && parentName && (
              <div className="text-[11px] text-muted">{t('hover.affiliate_of', { team: parentName })}</div>
            )}
          </div>
        )
      )}

      {ranks.length > 0 && (
        <div className="mt-2.5">
          <div className="text-[10px] font-semibold text-muted mb-1">{t('hover.leaderboard')}</div>
          <ul className="space-y-1">
            {ranks.map((r) => (
              <li key={r.category} className="flex items-center justify-between gap-2">
                <span className="truncate">{t(`leaders.cat_${r.category}` as TranslationKey)}</span>
                <span className="font-mono shrink-0">
                  <span className="text-team-primary font-bold">
                    {lang === 'zh' ? t('hover.mlb_rank', { rank: r.rank }) : `MLB ${ordinal(r.rank)}`}
                  </span>
                  <span className="ml-1.5 text-muted">{r.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default PlayerCardContent;
