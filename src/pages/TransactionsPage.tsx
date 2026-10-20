import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, ArrowRight, MapPin } from 'lucide-react';
import { useLeagueTransactionsQuery } from '../services/queries';
import { getTeamLogoUrl } from '../services/mlbApi';
import { useLanguage } from '../hooks/useLanguage';
import { PlayerHoverCard } from '../components/common/PlayerHoverCard';
import { TeamHoverCard } from '../components/common/TeamHoverCard';
import { getEasternDateStr } from '../utils/timezone';
import { teamDisplayName, teamsById } from '../utils/teams';
import { isTrade, transactionTypeLabel } from '../utils/transactions';
import {
  MOVE_CATEGORIES,
  daysBefore,
  filterLeagueTransactions,
  groupByDate,
  movesOf,
  type MoveCategory,
} from '../utils/leagueTransactions';
import type { Transaction, TransactionTeam } from '../types/transactions';
import type { TranslationKey } from '../i18n/translations';
import taiwanPlayers from '../data/taiwan-players.json';
import { zhNameOf } from '../utils/players';

const RANGES = [7, 14, 30] as const;
/** Moves listed before "show more"; a month of "all" runs to thousands */
const PAGE_SIZE = 60;

const taiwanIds: ReadonlySet<number> = new Set(taiwanPlayers.players.map((p) => p.id));

const TeamLabel: React.FC<{ team: TransactionTeam }> = ({ team }) => {
  const { lang } = useLanguage();
  const name = teamDisplayName(team.id, lang, team.name) || '—';
  if (team.id === undefined) return <span className="font-semibold text-main">{name}</span>;
  return (
    <TeamHoverCard teamId={team.id} name={team.name}>
      <Link to={`/teams/${team.id}`} className="inline-flex items-center gap-1 font-semibold text-main hover:text-team-primary">
        <img
          src={getTeamLogoUrl(team.id)}
          alt=""
          className="w-4 h-4 object-contain shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span>{name}</span>
      </Link>
    </TeamHoverCard>
  );
};

/** One move: type, player, the club or clubs, and the API's own sentence */
const MoveRow: React.FC<{ move: Transaction }> = ({ move }) => {
  const { lang } = useLanguage();
  const { fromTeam: from, toTeam: to, person } = move;
  const moved = from?.id !== undefined && to?.id !== undefined && from.id !== to.id;
  const team = to ?? from;
  const zh = lang === 'zh' && person?.id ? zhNameOf(person.id) : undefined;
  return (
    <li className="px-4 py-3 space-y-1">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
            isTrade(move) ? 'bg-team-primary/15 text-team-primary' : 'bg-page text-muted border border-border/50'
          }`}
        >
          {transactionTypeLabel(move, lang)}
        </span>
        {person?.id !== undefined && (
          <PlayerHoverCard personId={person.id}>
            <Link to={`/players/${person.id}`} className="font-bold text-main hover:text-team-primary">
              {zh ? `${zh} ${person.fullName}` : person.fullName}
            </Link>
          </PlayerHoverCard>
        )}
        {moved ? (
          <span className="inline-flex flex-wrap items-center gap-1">
            <TeamLabel team={from} />
            <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" aria-label="→" />
            <TeamLabel team={to} />
          </span>
        ) : (
          team && <TeamLabel team={team} />
        )}
      </div>
      {move.description && <p className="text-[11px] text-muted leading-relaxed">{move.description}</p>}
    </li>
  );
};

const MoveList: React.FC<{ moves: Transaction[] }> = ({ moves }) => (
  <div className="space-y-4">
    {groupByDate(moves).map(({ date, moves: onDay }) => (
      <section key={date} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <h3 className="px-4 py-2 text-xs font-mono font-bold text-muted bg-page/60 border-b border-border/50">{date}</h3>
        <ul className="divide-y divide-border/30">
          {onDay.map((m, i) => (
            <MoveRow key={m.id ?? `${date}-${i}`} move={m} />
          ))}
        </ul>
      </section>
    ))}
  </div>
);

/**
 * Every big league club's roster moves over the last week, two or four:
 * signings and trades by default, any club or one. Moves of players from
 * Taiwan, of every type, come first.
 */
export const TransactionsPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);
  const [category, setCategory] = useState<MoveCategory>('notable');
  const [teamId, setTeamId] = useState<number | undefined>(undefined);
  const [shown, setShown] = useState(PAGE_SIZE);

  // US dates, as the API files moves
  const endDate = getEasternDateStr();
  const startDate = daysBefore(endDate, range - 1);
  const { data, isLoading, isError, refetch } = useLeagueTransactionsQuery(startDate, endDate);

  const moves = useMemo(
    () => filterLeagueTransactions(data?.transactions, { category, teamId }),
    [data, category, teamId]
  );
  const taiwanMoves = useMemo(() => movesOf(data?.transactions, taiwanIds), [data]);
  const clubs = [...teamsById.values()].sort((a, b) =>
    (teamDisplayName(a.id, lang) ?? '').localeCompare(teamDisplayName(b.id, lang) ?? '', lang === 'zh' ? 'zh-Hant' : 'en')
  );
  const resetPaging = () => setShown(PAGE_SIZE);

  const chip = (active: boolean) =>
    `px-2.5 py-1 rounded-md transition-colors ${active ? 'bg-team-primary text-white shadow-sm' : 'text-muted hover:text-main'}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-main transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>{t('team.back')}</span>
      </Link>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-main flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-team-primary" />
          {t('moves.title')}
        </h1>
        <p className="text-sm text-muted">{t('moves.subtitle', { start: startDate, end: endDate })}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div role="group" aria-label={t('moves.range_label')} className="flex p-1 bg-card border border-border rounded-lg text-xs font-semibold">
          {RANGES.map((days) => (
            <button
              key={days}
              type="button"
              aria-pressed={range === days}
              onClick={() => {
                setRange(days);
                resetPaging();
              }}
              className={chip(range === days)}
            >
              {t('moves.range_days', { days })}
            </button>
          ))}
        </div>
        <select
          value={teamId ?? ''}
          onChange={(e) => {
            setTeamId(e.target.value ? Number(e.target.value) : undefined);
            resetPaging();
          }}
          aria-label={t('moves.team_label')}
          className="max-w-[220px] rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-main focus:outline-none focus:border-team-primary"
        >
          <option value="">{t('moves.all_teams')}</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {teamDisplayName(c.id, lang)}
            </option>
          ))}
        </select>
      </div>

      <div role="group" aria-label={t('moves.category_label')} className="flex flex-wrap gap-1 p-1 bg-card border border-border rounded-lg text-xs font-semibold w-fit max-w-full">
        {MOVE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => {
              setCategory(c);
              resetPaging();
            }}
            className={chip(category === c)}
          >
            {t(`moves.category_${c}` as TranslationKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm text-rose-500 font-semibold">{t('moves.error')}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-team-primary text-white text-xs font-bold rounded-xl hover:opacity-90"
          >
            {t('sb.retry')}
          </button>
        </div>
      ) : (
        <>
          {taiwanMoves.length > 0 && (
            <section className="space-y-2.5" aria-labelledby="moves-taiwan">
              <h2 id="moves-taiwan" className="flex items-center gap-1.5 text-sm font-bold text-main">
                <MapPin className="w-4 h-4 text-team-primary" />
                {t('moves.taiwan', { count: taiwanMoves.length })}
              </h2>
              <MoveList moves={taiwanMoves} />
            </section>
          )}

          <section className="space-y-2.5" aria-labelledby="moves-all">
            <h2 id="moves-all" className="text-sm font-bold text-main">
              {t('moves.count', { count: moves.length })}
            </h2>
            {moves.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted">{t('moves.empty')}</div>
            ) : (
              <MoveList moves={moves.slice(0, shown)} />
            )}
            {moves.length > shown && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShown(shown + PAGE_SIZE)}
                  className="px-4 py-2 text-xs font-semibold text-team-primary hover:underline"
                >
                  {t('moves.show_more', { count: moves.length - shown })}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
