import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Medal } from 'lucide-react';
import { usePostseasonQuery, useStandingsQuery } from '../services/queries';
import { getTeamLogoUrl } from '../services/mlbApi';
import { useLanguage } from '../hooks/useLanguage';
import { getCurrentMlbSeason } from '../utils/season';
import {
  buildPostseasonBracket,
  getPostseasonSeasons,
  type BracketSeries,
  type BracketTeam,
  type PostseasonBracket,
} from '../utils/postseason';
import { BracketDiagram } from '../components/postseason/BracketDiagram';
import { POSTSEASON_FIRST_SEASON } from '../constants/season';
import type { TranslationKey } from '../i18n/translations';
import teamsData from '../data/teams.json';

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
      data-testid="selected-series"
      className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm overflow-hidden"
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

/** Every series in the bracket, World Series last */
const allSeries = (bracket: PostseasonBracket): BracketSeries[] => {
  const list: BracketSeries[] = [];
  const walk = (s: BracketSeries | null) => {
    if (!s) return;
    s.feeders.forEach(walk);
    list.push(s);
  };
  walk(bracket.AL);
  walk(bracket.NL);
  if (bracket.worldSeries) list.push(bracket.worldSeries);
  return list;
};

/** The series whose latest game is the most recent one played, else the World Series */
function latestSeriesId(bracket: PostseasonBracket): string | undefined {
  let latest: { id: string; date: string } | undefined;
  allSeries(bracket).forEach((s) =>
    s.games
      .filter((g) => g.status.abstractGameState !== 'Preview')
      .forEach((g) => {
        if (!latest || g.gameDate > latest.date) latest = { id: s.id, date: g.gameDate };
      })
  );
  return latest?.id ?? bracket.worldSeries?.id;
}

export const PostseasonPage: React.FC = () => {
  const { t } = useLanguage();
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
  const bracket = useMemo(
    () => buildPostseasonBracket(seriesQuery.data, standingsQuery.data),
    [seriesQuery.data, standingsQuery.data]
  );

  // Keyed to the season, like the level choice on the player page: a series
  // picked in one season means nothing in the next
  const [picked, setPicked] = useState<{ season: number; id: string } | null>(null);
  const selectedId = (picked?.season === season ? picked.id : undefined) ?? (bracket ? latestSeriesId(bracket) : undefined);
  const selected = bracket ? allSeries(bracket).find((s) => s.id === selectedId) : undefined;

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
        <div className="bg-card border border-border rounded-2xl shadow-sm p-3 sm:p-5 space-y-4">
          <div className="overflow-x-auto">
            <BracketDiagram
              bracket={bracket}
              season={season}
              selectedSeriesId={selectedId}
              onSelectSeries={(id) => setPicked({ season, id })}
            />
          </div>
          <p className="text-[11px] text-muted text-center">{t('postseason.select_hint')}</p>
          {selected && (
            <div className="flex justify-center">
              <SeriesCard series={selected} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
