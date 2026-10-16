import React from 'react';
import { useStandingsQuery, useTeamDetailQuery } from '../../services/queries';
import { getTeamLogoUrl } from '../../services/mlbApi';
import { useLanguage } from '../../hooks/useLanguage';
import teamsData from '../../data/teams.json';
import { findTeamStanding, levelAbbreviation, ordinal } from '../../utils/hoverCards';

const teamsById = new Map(teamsData.map((t) => [t.id, t]));

const CardHeader: React.FC<{ teamId: number; name: string; sub?: string }> = ({ teamId, name, sub }) => (
  <div className="flex items-center gap-2.5">
    <img
      src={getTeamLogoUrl(teamId)}
      alt=""
      className="w-8 h-8 object-contain shrink-0"
      onError={(e) => {
        (e.target as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
    <div className="min-w-0">
      <div className="font-bold text-sm truncate">{name}</div>
      {sub && <div className="text-[11px] text-muted truncate">{sub}</div>}
    </div>
  </div>
);

const Loading = () => <div className="mt-2 h-4 rounded bg-page animate-pulse" />;

/** A big league club: where it stands in its division */
const MlbTeamCard: React.FC<{ teamId: number }> = ({ teamId }) => {
  const { lang, t } = useLanguage();
  const meta = teamsById.get(teamId)!;
  // Same query as the standings page, so a visit there has usually filled it
  const { data, isLoading } = useStandingsQuery();
  const record = findTeamStanding(data, teamId);
  const division = lang === 'zh' ? meta.divisionZh : `${meta.league} ${meta.division}`;

  return (
    <>
      <CardHeader teamId={teamId} name={lang === 'zh' ? meta.nameZh : meta.name} sub={division} />
      {isLoading ? (
        <Loading />
      ) : record ? (
        <dl className="mt-2.5 grid grid-cols-3 gap-2 text-center">
          <div>
            <dt className="text-[10px] text-muted">{t('hover.division_rank')}</dt>
            <dd className="font-mono font-bold text-sm">
              {record.divisionRank
                ? lang === 'zh'
                  ? t('hover.rank_value', { rank: record.divisionRank })
                  : ordinal(Number(record.divisionRank))
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-muted">{t('hover.win_pct')}</dt>
            <dd className="font-mono font-bold text-sm text-team-primary">{record.winningPercentage}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-muted">{t('hover.record')}</dt>
            <dd className="font-mono font-bold text-sm">
              {record.wins}-{record.losses}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-muted">{t('hover.no_standing')}</p>
      )}
    </>
  );
};

/** A minor league club: which organisation it belongs to */
const MilbTeamCard: React.FC<{ teamId: number; fallbackName?: string }> = ({ teamId, fallbackName }) => {
  const { lang, t } = useLanguage();
  // Same query as the team page, so hovering also warms it
  const { data, isLoading } = useTeamDetailQuery(teamId);
  const team = data?.teams?.[0];
  const level = levelAbbreviation(team?.sport?.id) ?? team?.sport?.name;
  const parent = team?.parentOrgId !== undefined ? teamsById.get(team.parentOrgId) : undefined;
  const parentName = (lang === 'zh' ? parent?.nameZh : parent?.name) || team?.parentOrgName;
  const sub = [level, team?.league?.name].filter(Boolean).join(' · ');

  return (
    <>
      <CardHeader teamId={teamId} name={team?.name ?? fallbackName ?? ''} sub={sub || undefined} />
      {isLoading ? (
        <Loading />
      ) : parentName ? (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-page px-2.5 py-2">
          {team?.parentOrgId !== undefined && (
            <img
              src={getTeamLogoUrl(team.parentOrgId)}
              alt=""
              className="w-5 h-5 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span>{t('hover.affiliate_of', { team: parentName })}</span>
        </div>
      ) : (
        <p className="mt-2 text-muted">{t('hover.no_affiliation')}</p>
      )}
    </>
  );
};

/** Card body for TeamHoverCard; a module of its own so it loads on first hover */
const TeamCardContent: React.FC<{ teamId: number; name?: string }> = ({ teamId, name }) =>
  teamsById.has(teamId) ? <MlbTeamCard teamId={teamId} /> : <MilbTeamCard teamId={teamId} fallbackName={name} />;

export default TeamCardContent;
