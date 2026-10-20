import React from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Award, MapPin } from 'lucide-react';
import { useAwardHistoryQuery, useSeasonAwardsQueries } from '../services/queries';
import { getPlayerHeadshotUrl, getTeamLogoUrl } from '../services/mlbApi';
import { useLanguage } from '../hooks/useLanguage';
import { PlayerHoverCard } from '../components/common/PlayerHoverCard';
import { teamDisplayName } from '../utils/teams';
import { zhNameOf } from '../utils/players';
import { defaultAwardsSeason, historyBySeason, leagueOf, rowsByPosition } from '../utils/awards';
import {
  ALL_AWARD_IDS,
  HALL_OF_FAME,
  POSITION_AWARDS,
  POSTSEASON_AWARDS,
  SEASON_AWARDS,
  groupOf,
  type AwardGroup,
} from '../constants/awards';
import type { AwardRecipient } from '../types/awards';
import type { TranslationKey } from '../i18n/translations';
import taiwanPlayers from '../data/taiwan-players.json';

const taiwanIds: ReadonlySet<number> = new Set(taiwanPlayers.players.map((p) => p.id));
/** Seasons offered in the menu, newest first */
const SEASONS_BACK = 25;

const awardTitle = (group: AwardGroup) => `awards.${group.key}` as TranslationKey;

/** A winner: name (Chinese first in the zh UI), club, and a mark for players from Taiwan */
const Winner: React.FC<{ r: AwardRecipient; withPhoto?: boolean }> = ({ r, withPhoto }) => {
  const { lang, t } = useLanguage();
  const id = r.player?.id;
  const zh = lang === 'zh' ? zhNameOf(id) : undefined;
  const team = teamDisplayName(r.team?.id, lang);
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {withPhoto && id && (
        <img
          src={getPlayerHeadshotUrl(id)}
          alt=""
          className="w-10 h-10 rounded-full bg-page object-cover border border-border shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.visibility = 'hidden';
          }}
        />
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {id ? (
            <PlayerHoverCard personId={id}>
              <Link to={`/players/${id}`} className="font-bold text-main hover:text-team-primary">
                {zh ?? r.player?.nameFirstLast}
              </Link>
            </PlayerHoverCard>
          ) : (
            <span className="font-bold text-main">{r.player?.nameFirstLast}</span>
          )}
          {id && taiwanIds.has(id) && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600">
              <MapPin className="w-3 h-3" />
              {t('awards.taiwan')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted">
          {zh && <span>{r.player?.nameFirstLast}</span>}
          {r.team?.id && (
            <img src={getTeamLogoUrl(r.team.id)} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
          )}
          {team && <span>{team}</span>}
          {r.notes && <span>· {r.notes}</span>}
        </div>
      </div>
    </div>
  );
};

/**
 * One season's major awards, postseason MVPs, Gold Gloves and Silver
 * Sluggers, and Hall of Fame inductees, a request per award. Each award's
 * title opens its full history.
 */
export const AwardsPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const latest = defaultAwardsSeason();
  const requested = Number(params.get('season'));
  const season = Number.isInteger(requested) && requested > 1900 && requested <= latest + 1 ? requested : latest;
  const results = useSeasonAwardsQueries(ALL_AWARD_IDS, season);
  const byId = new Map(ALL_AWARD_IDS.map((id, i) => [id, results[i]]));
  const winnersOf = (id: string) => byId.get(id)?.data?.awards ?? [];
  const loading = results.some((r) => r.isLoading);
  const failed = results.every((r) => r.isError);

  const leagueLabel = (id: string) => {
    const league = leagueOf(id);
    return league ? t(league === 'AL' ? 'awards.al' : 'awards.nl') : '';
  };

  const pending = <span className="text-xs text-muted">{t('awards.pending')}</span>;

  const pairCard = (group: AwardGroup) => (
    <section key={group.key} className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
      <h3 className="font-bold text-sm text-main">
        <Link to={`/awards/${group.ids[0]}`} className="hover:text-team-primary">
          {t(awardTitle(group))}
        </Link>
      </h3>
      <div className="space-y-3">
        {group.ids.map((id) => (
          <div key={id} className="space-y-1">
            {leagueOf(id) && (
              <Link to={`/awards/${id}`} className="text-[11px] font-semibold text-muted hover:text-team-primary">
                {leagueLabel(id)}
              </Link>
            )}
            {winnersOf(id).length > 0 ? winnersOf(id).map((r, i) => <Winner key={i} r={r} withPhoto />) : pending}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <Link to="/leaders" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>{t('awards.back')}</span>
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold text-main flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            {t('awards.title')}
          </h1>
          <p className="text-sm text-muted">{t('awards.subtitle')}</p>
        </div>
        <select
          value={season}
          onChange={(e) => setParams({ season: e.target.value }, { replace: true })}
          aria-label={t('awards.season')}
          className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-main focus:outline-none focus:border-team-primary"
        >
          {Array.from({ length: SEASONS_BACK }, (_, i) => latest - i).map((y) => (
            <option key={y} value={y}>
              {lang === 'zh' ? `${y} 年` : y}
            </option>
          ))}
        </select>
      </div>

      {failed ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-rose-500">{t('awards.error')}</div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{SEASON_AWARDS.map(pairCard)}</div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-main">{t('awards.postseason')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{POSTSEASON_AWARDS.map(pairCard)}</div>
          </div>

          {POSITION_AWARDS.map((group) => {
            const [alId, nlId] = group.ids;
            const rows = rowsByPosition(winnersOf(alId), winnersOf(nlId));
            return (
              <section key={group.key} className="space-y-2">
                <h2 className="text-lg font-bold text-main">
                  <Link to={`/awards/${alId}`} className="hover:text-team-primary">
                    {t(awardTitle(group))}
                  </Link>
                </h2>
                {rows.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-6 text-center">{pending}</div>
                ) : (
                  <div className="bg-card border border-border rounded-2xl shadow-sm overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted">
                          <th scope="col" className="px-3 py-2 text-left w-14">{t('awards.position')}</th>
                          <th scope="col" className="px-3 py-2 text-left min-w-[150px]">{leagueLabel(alId)}</th>
                          <th scope="col" className="px-3 py-2 text-left min-w-[150px]">{leagueLabel(nlId)}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {rows.map((row) => (
                          <tr key={row.position}>
                            <th scope="row" className="px-3 py-2 text-left text-xs font-mono text-muted align-top">
                              {row.position}
                            </th>
                            {[row.al, row.nl].map((winners, i) => (
                              <td key={i} className="px-3 py-2 align-top space-y-1.5">
                                {winners.map((r) => (
                                  <Winner key={r.player?.id} r={r} />
                                ))}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-main">
              <Link to={`/awards/${HALL_OF_FAME.ids[0]}`} className="hover:text-team-primary">
                {t(awardTitle(HALL_OF_FAME))}
              </Link>
            </h2>
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
              {winnersOf(HALL_OF_FAME.ids[0]).length > 0
                ? winnersOf(HALL_OF_FAME.ids[0]).map((r) => <Winner key={r.player?.id} r={r} withPhoto />)
                : pending}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

/** Every season's winners of one award, newest first */
export const AwardHistoryPage: React.FC = () => {
  const { t } = useLanguage();
  const { awardId = '' } = useParams<{ awardId: string }>();
  const group = groupOf(awardId);
  const { data, isLoading, isError } = useAwardHistoryQuery(group ? awardId : undefined);
  const seasons = historyBySeason(data?.awards);
  const league = leagueOf(awardId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <Link to="/awards" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>{t('awards.title')}</span>
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-main flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-500" />
          {group ? t(awardTitle(group)) : awardId}
          {league && <span className="text-base text-muted">· {t(league === 'AL' ? 'awards.al' : 'awards.nl')}</span>}
        </h1>
        {group && group.ids.length > 1 && (
          <div className="flex gap-1 p-1 bg-card border border-border rounded-lg text-xs font-semibold w-fit">
            {group.ids.map((id) => (
              <Link
                key={id}
                to={`/awards/${id}`}
                replace
                className={`px-3 py-1 rounded-md transition-colors ${
                  id === awardId ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'
                }`}
              >
                {t(leagueOf(id) === 'AL' ? 'awards.al' : 'awards.nl')}
              </Link>
            ))}
          </div>
        )}
      </div>

      {!group ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted">{t('awards.unknown')}</div>
      ) : isError ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-rose-500">{t('awards.error')}</div>
      ) : isLoading ? (
        <div className="bg-card border border-border rounded-2xl h-96 animate-pulse" />
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm divide-y divide-border/30">
          {seasons.map(({ season, winners }) => (
            <div key={season} className="flex gap-4 px-4 py-3">
              <Link
                to={`/awards?season=${season}`}
                className="w-12 shrink-0 font-mono text-sm font-bold text-muted hover:text-team-primary pt-0.5"
              >
                {season}
              </Link>
              <div className={`flex-1 min-w-0 grid gap-2 ${winners.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                {winners.map((r, i) => (
                  <Winner key={`${r.player?.id}-${i}`} r={r} />
                ))}
              </div>
            </div>
          ))}
          {seasons.length === 0 && <div className="p-8 text-center text-sm text-muted">{t('awards.pending')}</div>}
        </div>
      )}
      {group && <p className="text-[11px] text-muted">{t('awards.history_note')}</p>}
    </div>
  );
};
