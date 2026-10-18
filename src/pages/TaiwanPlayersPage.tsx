import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useFavoritePlayersGameLogQuery } from '../services/queries';
import { useLanguage } from '../hooks/useLanguage';
import { FavoritePlayerSummaryCard } from '../components/favorite/FavoritePlayerSummaryCard';
import { PlayerHoverCard } from '../components/common/PlayerHoverCard';
import { getEasternDateStr } from '../utils/timezone';
import type { TranslationKey } from '../i18n/translations';
import taiwanPlayers from '../data/taiwan-players.json';
import playersData from '../data/players-zh-tw.json';

/** Top of the ladder first; the list file names levels this way */
const LEVELS = ['MLB', 'AAA', 'AA', 'A+', 'A', 'ROK'] as const;

const zhNames = new Map(playersData.map((p) => [p.id, p]));

/**
 * Every player born in Taiwan on an MLB or minor league roster, by level,
 * each with his latest game. The list comes from src/data/taiwan-players.json,
 * rebuilt weekly from the live API (scripts/update-taiwan-players.mjs); the
 * games come from one batch request, the one the favorites summary uses.
 */
export const TaiwanPlayersPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const players = taiwanPlayers.players;
  const ids = useMemo(() => players.map((p) => p.id), [players]);
  const { data, isLoading } = useFavoritePlayersGameLogQuery(ids);
  const people = useMemo(() => new Map((data?.people ?? []).map((p) => [p.id, p])), [data]);
  // MLB game log dates are US dates
  const todayDateStr = getEasternDateStr();

  const groups = LEVELS.map((level) => ({ level, players: players.filter((p) => p.level === level) })).filter(
    (g) => g.players.length > 0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>{t('team.back')}</span>
      </Link>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-main flex items-center gap-2">
          <MapPin className="w-6 h-6 text-team-primary" />
          {t('taiwan.title')}
        </h1>
        <p className="text-sm text-muted">
          {t('taiwan.subtitle', { season: taiwanPlayers.season, count: players.length })}
        </p>
      </div>

      {groups.map(({ level, players: atLevel }) => (
        <section key={level} className="space-y-3" aria-labelledby={`taiwan-${level}`}>
          <h2 id={`taiwan-${level}`} className="flex items-baseline gap-2 border-b border-border pb-2">
            <span className="text-lg font-bold text-main">{t(`taiwan.level_${level}` as TranslationKey)}</span>
            <span className="text-xs text-muted">{t('taiwan.level_count', { count: atLevel.length })}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {atLevel.map((player) => {
              const person = people.get(player.id);
              const zhMeta = zhNames.get(player.id);
              if (person) {
                return (
                  <FavoritePlayerSummaryCard
                    key={player.id}
                    person={person}
                    zhMeta={zhMeta}
                    todayDateStr={todayDateStr}
                    showNameZh
                  />
                );
              }
              if (isLoading) {
                return (
                  <div
                    key={player.id}
                    className="bg-card/60 border border-border rounded-2xl p-4 h-40 animate-pulse"
                  />
                );
              }
              // Not in the batch answer (the request failed, or he left the
              // game): what the list file knows is still worth a row
              return (
                <div key={player.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <PlayerHoverCard personId={player.id}>
                    <Link
                      to={`/players/${player.id}`}
                      className="text-sm font-bold text-main hover:text-team-primary transition-colors"
                    >
                      {player.fullName}
                    </Link>
                  </PlayerHoverCard>
                  {lang === 'zh' && zhMeta?.nameZh && (
                    <div className="text-xs font-semibold text-main/80">{zhMeta.nameZh}</div>
                  )}
                  <div className="mt-1 text-[11px] text-muted">
                    {[player.position, player.teamName].filter(Boolean).join(' · ')}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
