import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Medal, Trophy } from 'lucide-react';
import { usePostseasonQuery, useStandingsQuery } from '../services/queries';
import { getTeamLogoUrl } from '../services/mlbApi';
import { useLanguage } from '../hooks/useLanguage';
import { getCurrentMlbSeason } from '../utils/season';
import {
  buildPostseasonBracket,
  getPostseasonSeasons,
  type BracketLeague,
  type BracketSeries,
  type BracketTeam,
} from '../utils/postseason';
import { POSTSEASON_FIRST_SEASON } from '../constants/season';
import type { TranslationKey } from '../i18n/translations';
import teamsData from '../data/teams.json';

/** Which way a league's subtree grows: side by side on wide screens the NL mirrors the AL */
type Direction = 'ltr' | 'rtl';

const TeamRow: React.FC<{ team: BracketTeam; isWinner: boolean; isLoser: boolean }> = ({
  team,
  isWinner,
  isLoser,
}) => {
  const { lang, t } = useLanguage();
  const meta = teamsData.find((m) => m.id === team.id);
  const name = lang === 'zh' ? meta?.nameZh || team.name : meta?.name || team.name;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 text-xs ${isLoser ? 'opacity-50' : ''} ${
        isWinner ? 'font-bold' : ''
      }`}
    >
      <span className="w-3.5 shrink-0 text-center font-mono text-[10px] text-muted" data-seed={team.seed}>
        {team.seed ?? ''}
      </span>
      {team.isPlaceholder ? (
        <span className="flex-1 min-w-0 truncate text-muted italic" title={team.name}>
          {t('postseason.tbd')}
          <span className="ml-1 text-[10px] not-italic">{team.name}</span>
        </span>
      ) : (
        <>
          <img src={getTeamLogoUrl(team.id)} alt="" className="w-4 h-4 shrink-0 object-contain" />
          <Link
            to={`/teams/${team.id}`}
            className="flex-1 min-w-0 truncate text-main hover:text-team-primary"
            title={name}
          >
            {name}
          </Link>
        </>
      )}
      <span className={`w-3 shrink-0 text-right font-mono ${isWinner ? 'text-team-primary' : 'text-muted'}`}>
        {team.wins}
      </span>
    </div>
  );
};

const SeriesCard: React.FC<{ series: BracketSeries }> = ({ series }) => {
  const { t } = useLanguage();
  // Postponed entries sit next to their make-up game; only games with a score get a link
  const played = series.games.filter(
    (g) =>
      g.status.abstractGameState !== 'Preview' &&
      g.status.detailedState !== 'Postponed' &&
      g.teams.home.score !== undefined
  );
  const format =
    series.bestOf === 1
      ? t('postseason.single_game')
      : t('postseason.best_of', { games: series.bestOf, wins: Math.floor(series.bestOf / 2) + 1 });

  return (
    <div
      data-testid={`series-${series.id}`}
      className="w-40 shrink-0 bg-card border border-border rounded-lg shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-2 py-1 bg-page/60 border-b border-border text-[10px] text-muted">
        <span className="font-semibold text-team-primary">{t(`postseason.round_${series.round}` as TranslationKey)}</span>
        <span>{format}</span>
      </div>
      {[series.top, series.bottom].map((team) => (
        <TeamRow
          key={team.id}
          team={team}
          isWinner={series.winnerId === team.id}
          isLoser={series.winnerId !== null && series.winnerId !== team.id}
        />
      ))}
      {played.length > 0 && (
        <div className="flex flex-wrap gap-1 px-2 py-1 border-t border-border/50">
          {played.map((g, i) => (
            <Link
              key={g.gamePk}
              to={`/games/${g.gamePk}`}
              title={`${g.teams.away.team.name} ${g.teams.away.score ?? ''} - ${g.teams.home.score ?? ''} ${g.teams.home.team.name}`}
              className="px-1 rounded bg-page border border-border font-mono text-[10px] text-muted hover:text-team-primary hover:border-team-primary"
            >
              G{g.seriesGameNumber ?? i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/** A series with the earlier-round series that fed it, drawn as a horizontal tree */
const BracketNode: React.FC<{ series: BracketSeries; direction: Direction }> = ({ series, direction }) => (
  <div className={`flex items-center ${direction === 'rtl' ? 'xl:flex-row-reverse' : ''}`}>
    {series.feeders.length > 0 && (
      <>
        <div className="flex flex-col gap-3">
          {series.feeders.map((f) => (
            <BracketNode key={f.id} series={f} direction={direction} />
          ))}
        </div>
        <div className="w-3 h-px shrink-0 bg-border" aria-hidden="true" />
      </>
    )}
    <SeriesCard series={series} />
  </div>
);

const LeagueBracket: React.FC<{ league: BracketLeague; root: BracketSeries | null; direction: Direction }> = ({
  league,
  root,
  direction,
}) => {
  const { t } = useLanguage();
  if (!root) return null;
  return (
    <section className="space-y-2 min-w-0">
      <h2 className={`text-sm font-bold text-main ${direction === 'rtl' ? 'xl:text-right' : ''}`}>
        {t(league === 'AL' ? 'postseason.al' : 'postseason.nl')}
      </h2>
      <div className="overflow-x-auto pb-2">
        <div className={`flex w-max ${direction === 'rtl' ? 'xl:ml-auto' : ''}`}>
          <BracketNode series={root} direction={direction} />
        </div>
      </div>
    </section>
  );
};

export const PostseasonPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const params = useParams<{ season?: string }>();
  const currentSeason = getCurrentMlbSeason();
  const requested = Number(params.season);
  const season =
    Number.isInteger(requested) && requested >= POSTSEASON_FIRST_SEASON && requested <= currentSeason
      ? requested
      : currentSeason;

  const seriesQuery = usePostseasonQuery(season);
  const standingsQuery = useStandingsQuery(season);
  const bracket = buildPostseasonBracket(seriesQuery.data, standingsQuery.data);
  const ws = bracket?.worldSeries;
  const champion = ws?.winnerId ? teamsData.find((m) => m.id === ws.winnerId) : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>{t('player.back')}</span>
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Medal className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-main tracking-tight">{t('postseason.title')}</h1>
          </div>
          <p className="text-xs text-muted max-w-xl">
            {t('postseason.subtitle', { season })}
            {bracket && <span className="ml-1">· {t('postseason.seed_hint')}</span>}
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-muted">
          <span>{t('postseason.season_label')}</span>
          <select
            value={season}
            onChange={(e) => navigate(`/postseason/${e.target.value}`)}
            className="bg-page border border-border rounded-lg px-2.5 py-1.5 text-main font-mono"
          >
            {getPostseasonSeasons(currentSeason).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {seriesQuery.isLoading && <div className="bg-card border border-border rounded-xl h-64 animate-pulse" />}

      {seriesQuery.isError && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-rose-500 text-sm space-y-3">
          <p>{t('postseason.load_error')}</p>
          <button
            onClick={() => seriesQuery.refetch()}
            className="px-3 py-1.5 rounded-lg bg-team-primary text-white text-xs font-semibold"
          >
            {t('game.retry')}
          </button>
        </div>
      )}

      {seriesQuery.isSuccess && !bracket && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted text-sm">
          {t('postseason.empty', { season })}
        </div>
      )}

      {bracket && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr] xl:items-center gap-6">
          <LeagueBracket league="AL" root={bracket.AL} direction="ltr" />

          {ws && (
            <section className="flex flex-col items-center gap-3 xl:order-none order-last">
              {champion && (
                <div className="flex flex-col items-center gap-1 text-center">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  <span className="text-[10px] font-semibold text-muted">{t('postseason.champion')}</span>
                  <span data-testid="champion" className="text-sm font-black text-main">
                    {lang === 'zh' ? champion.nameZh : champion.name}
                  </span>
                </div>
              )}
              <SeriesCard series={ws} />
            </section>
          )}

          <LeagueBracket league="NL" root={bracket.NL} direction="rtl" />
        </div>
      )}
    </div>
  );
};
