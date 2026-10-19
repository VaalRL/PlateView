import type { Transaction } from '../types/transactions';
import { sortTransactions, transactionDate } from './transactions';

/**
 * The league-wide moves page: which moves count as news, how the list is
 * narrowed, and the date range it covers.
 */

export type MoveCategory = 'notable' | 'trades' | 'signings' | 'departures' | 'all';

export const MOVE_CATEGORIES: readonly MoveCategory[] = ['notable', 'trades', 'signings', 'departures', 'all'];

/** Move types by category, keyed by the API's English `typeDesc` like the labels */
const CATEGORY_TYPES: Record<Exclude<MoveCategory, 'notable' | 'all'>, readonly string[]> = {
  trades: ['Trade'],
  signings: ['Signed as Free Agent', 'Signed', 'Signed as Draft Pick'],
  departures: ['Declared Free Agency', 'Released', 'Designated for Assignment', 'Claimed Off Waivers', 'Retired'],
};

/**
 * What changes a club: trades, signings and players leaving. Options,
 * recalls, injured list moves and minor league assignments, most of a
 * season's moves, are left to "all".
 */
const NOTABLE = new Set([...CATEGORY_TYPES.trades, ...CATEGORY_TYPES.signings, ...CATEGORY_TYPES.departures]);

export function inCategory(t: Transaction, category: MoveCategory): boolean {
  if (category === 'all') return true;
  const desc = t.typeDesc ?? '';
  return category === 'notable' ? NOTABLE.has(desc) : CATEGORY_TYPES[category].includes(desc);
}

/** A club's moves, either side of them */
export const involvesTeam = (t: Transaction, teamId: number): boolean =>
  t.fromTeam?.id === teamId || t.toTeam?.id === teamId;

/**
 * The moves to show, newest first: in the category, of the club when one is
 * chosen, and only moves about a player (the API also files a few about
 * nobody in particular).
 */
export function filterLeagueTransactions(
  transactions: Transaction[] | undefined,
  { category, teamId }: { category: MoveCategory; teamId?: number }
): Transaction[] {
  return sortTransactions(
    (transactions ?? []).filter(
      (t) => t.person?.id !== undefined && inCategory(t, category) && (teamId === undefined || involvesTeam(t, teamId))
    )
  );
}

/** Moves of the given players, of every type: for players followed closely */
export function movesOf(transactions: Transaction[] | undefined, personIds: ReadonlySet<number>): Transaction[] {
  return sortTransactions((transactions ?? []).filter((t) => personIds.has(t.person?.id ?? -1)));
}

/** Consecutive runs of moves filed on the same day, in the order given */
export function groupByDate(transactions: Transaction[]): { date: string; moves: Transaction[] }[] {
  const groups: { date: string; moves: Transaction[] }[] = [];
  transactions.forEach((t) => {
    const date = transactionDate(t);
    const last = groups[groups.length - 1];
    if (last?.date === date) last.moves.push(t);
    else groups.push({ date, moves: [t] });
  });
  return groups;
}

/** The day `days` before a YYYY-MM-DD date, as YYYY-MM-DD */
export function daysBefore(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const back = new Date(Date.UTC(y, m - 1, d - days));
  return back.toISOString().slice(0, 10);
}
