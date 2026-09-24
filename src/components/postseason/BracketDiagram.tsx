import React, { useMemo } from 'react';
import { useHref, useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { getTeamCapLogoUrl } from '../../services/mlbApi';
import { useLanguage } from '../../hooks/useLanguage';
import { layoutBracket, type SlotTile } from '../../utils/bracketLayout';
import type { BracketSeries, PostseasonBracket } from '../../utils/postseason';
import type { TranslationKey } from '../../i18n/translations';
import teamsData from '../../data/teams.json';

/** Half-diagonal of a team tile and of the champion's tile */
const TILE = 30;
const CHAMPION_TILE = 40;

const diamond = (r: number) => `0,${-r} ${r},0 0,${r} ${-r},0`;

const teamMeta = (id: number) => teamsData.find((t) => t.id === id);

/** Series score for the tag on its junction: the leader's wins first */
function seriesScore(series: BracketSeries): string {
  const wins = [series.top.wins, series.bottom.wins].sort((a, b) => b - a);
  return wins[0] + wins[1] === 0 ? 'vs' : `${wins[0]}-${wins[1]}`;
}

/**
 * Tile colour behind a cap logo. Mostly the primary colour, but a few cap logos
 * are drawn in that same colour (the Giants' orange SF, the Pirates' gold P),
 * so those teams carry the colour of their actual cap instead.
 */
function capTileColor(meta: { primaryColor?: string; capTileColor?: string } | undefined): string {
  return meta?.capTileColor ?? meta?.primaryColor ?? '#334155';
}

/** A diamond in the team's colour with its cap logo; a grey one for a slot not yet decided */
const TeamTile: React.FC<{ slot: SlotTile }> = ({ slot }) => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const path = `/teams/${slot.team.id}`;
  const href = useHref(path);
  const meta = teamMeta(slot.team.id);
  const name = (lang === 'zh' ? meta?.nameZh : meta?.name) || slot.team.name;

  const seed = slot.team.seed !== undefined && (
    <g transform={`translate(${-TILE * 0.78} ${-TILE * 0.78})`} aria-hidden="true">
      <circle r={10} className="fill-card stroke-muted/60" strokeWidth={1.5} />
      <text textAnchor="middle" dominantBaseline="central" className="fill-main font-black" fontSize={12}>
        {slot.team.seed}
      </text>
    </g>
  );

  if (slot.team.isPlaceholder) {
    return (
      <g
        transform={`translate(${slot.x} ${slot.y})`}
        data-series={slot.seriesId}
        data-team={slot.team.id}
        role="img"
        aria-label={`${t('postseason.tbd')}：${slot.team.name}`}
      >
        <title>{`${t('postseason.tbd')}：${slot.team.name}`}</title>
        {/* Opaque base so the connector lines stop at the tile's edge */}
        <polygon points={diamond(TILE)} className="fill-card" />
        <polygon points={diamond(TILE)} className="fill-muted/25" />
      </g>
    );
  }

  const label = slot.team.seed !== undefined ? `${name}（${t('postseason.seed', { seed: slot.team.seed })}）` : name;
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigate(path);
      }}
      aria-label={label}
      className="focus:outline-none [&:focus-visible>g>polygon:first-of-type]:stroke-team-primary"
    >
      <g
        transform={`translate(${slot.x} ${slot.y})`}
        data-series={slot.seriesId}
        data-team={slot.team.id}
        data-seed={slot.team.seed}
        data-eliminated={slot.eliminated}
      >
        <title>{label}</title>
        {/* Opaque base: a dimmed, knocked-out tile must not let the lines show through */}
        <polygon points={diamond(TILE)} className="fill-card stroke-card" strokeWidth={3} />
        <g opacity={slot.eliminated ? 0.38 : 1}>
          <polygon points={diamond(TILE)} fill={capTileColor(meta)} />
          <polygon points={diamond(TILE - 5)} fill="none" stroke="#fff" strokeWidth={2} />
          <image href={getTeamCapLogoUrl(slot.team.id)} x={-16} y={-16} width={32} height={32} />
          {seed}
        </g>
      </g>
    </a>
  );
};

interface BracketDiagramProps {
  bracket: PostseasonBracket;
  season: number;
  selectedSeriesId?: string;
  onSelectSeries: (id: string) => void;
}

/**
 * Postseason bracket drawn after MLB's "Postseason Picture": team diamonds,
 * thick elbow connectors, AL on the left, NL mirrored, the World Series and
 * its champion in the middle. Geometry comes from utils/bracketLayout.
 */
export const BracketDiagram: React.FC<BracketDiagramProps> = ({
  bracket,
  season,
  selectedSeriesId,
  onSelectSeries,
}) => {
  const { lang, t } = useLanguage();
  const layout = useMemo(() => layoutBracket(bracket), [bracket]);
  const { width, height, champion } = layout;
  const center = width / 2;
  const wsMarker = layout.markers.find((m) => m.series.round === 'W');
  const championMeta = champion.team ? teamMeta(champion.team.id) : undefined;
  const championName = champion.team
    ? (lang === 'zh' ? championMeta?.nameZh : championMeta?.name) || champion.team.name
    : t('postseason.tbd');

  const formatOf = (bestOf: number) =>
    bestOf === 1 ? t('postseason.single_game') : t('postseason.best_of', { games: bestOf, wins: Math.floor(bestOf / 2) + 1 });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full min-w-[640px] h-auto select-none"
      role="group"
      aria-label={t('postseason.title')}
    >
      {/* Title */}
      <text x={center} y={46} textAnchor="middle" className="fill-main font-black uppercase" fontSize={30} letterSpacing={1}>
        {t('postseason.picture')}
      </text>
      <text x={center} y={74} textAnchor="middle" className="fill-amber-500 font-black" fontSize={20} letterSpacing={4}>
        {season}
      </text>

      {/* Round names across the top, series lengths along the bottom */}
      {layout.columns
        .filter((c) => c.round !== 'W')
        .map((c) => (
          <g key={`${c.league}-${c.round}`}>
            <text x={c.x} y={112} textAnchor="middle" className="fill-main font-black" fontSize={15}>
              {t(`postseason.head_${c.round}` as TranslationKey, {
                league: t(c.league === 'AL' ? 'postseason.al_short' : 'postseason.nl_short'),
              })}
            </text>
            <g transform={`translate(${c.x} ${height - 30})`}>
              <rect x={-44} y={-12} width={88} height={24} rx={6} className="fill-muted/15" />
              <text textAnchor="middle" dominantBaseline="central" className="fill-main font-bold" fontSize={11}>
                {formatOf(c.bestOf)}
              </text>
            </g>
          </g>
        ))}

      {/* Connectors */}
      <g className="stroke-muted/35" strokeWidth={7} fill="none" strokeLinecap="square">
        {layout.lines.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* World Series name and length under its junction */}
      {wsMarker && (
        <g>
          <text x={center} y={wsMarker.y + 42} textAnchor="middle" className="fill-main font-black" fontSize={16}>
            {t('postseason.round_W')}
          </text>
          <text x={center} y={wsMarker.y + 62} textAnchor="middle" className="fill-muted font-semibold" fontSize={11}>
            {formatOf(wsMarker.series.bestOf)}
          </text>
        </g>
      )}

      {/* Champion */}
      <g transform={`translate(${center} ${champion.y})`}>
        <text y={-CHAMPION_TILE - 26} textAnchor="middle" className="fill-muted font-semibold" fontSize={11}>
          {t('postseason.champion')}
        </text>
        <text y={-CHAMPION_TILE - 9} textAnchor="middle" className="fill-main font-black" fontSize={14} data-testid="champion">
          {championName}
        </text>
        {champion.team ? (
          <>
            <polygon
              points={diamond(CHAMPION_TILE)}
              fill={capTileColor(championMeta)}
              className="stroke-amber-500"
              strokeWidth={4}
            />
            <polygon points={diamond(CHAMPION_TILE - 7)} fill="none" stroke="#fff" strokeWidth={2} />
            <image href={getTeamCapLogoUrl(champion.team.id)} x={-22} y={-22} width={44} height={44} />
          </>
        ) : (
          <>
            <polygon points={diamond(CHAMPION_TILE)} className="fill-muted/25" />
            <Trophy x={-14} y={-14} width={28} height={28} className="text-muted" />
          </>
        )}
      </g>

      {/* Team tiles */}
      {layout.slots.map((slot) => (
        <TeamTile key={slot.key} slot={slot} />
      ))}

      {/* Series score tags: select a series to list its games below */}
      {layout.markers.map(({ series, x, y }) => {
        const selected = series.id === selectedSeriesId;
        return (
          <g
            key={series.id}
            transform={`translate(${x} ${y})`}
            data-testid={`series-${series.id}`}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={`${t(`postseason.round_${series.round}` as TranslationKey)} ${seriesScore(series)}`}
            onClick={() => onSelectSeries(series.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectSeries(series.id);
              }
            }}
            className="cursor-pointer focus:outline-none group"
          >
            <rect
              x={-21}
              y={-11}
              width={42}
              height={22}
              rx={11}
              className={
                selected
                  ? 'fill-team-primary stroke-team-primary'
                  : 'fill-card stroke-muted/50 group-hover:stroke-team-primary group-focus-visible:stroke-team-primary'
              }
              strokeWidth={2}
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              className={`font-mono font-bold ${selected ? 'fill-white' : 'fill-main'}`}
            >
              {seriesScore(series)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
