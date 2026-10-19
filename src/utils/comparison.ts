import { getLevelStat, type PlayerStatGroup } from './playerLevels';
import { outsOf } from './gameLogFilters';
import { MLB_SPORT_ID } from '../constants/levels';
import { STORAGE_KEYS } from '../constants/storage';
import {
  formatEra,
  formatFip,
  formatPer9,
  formatPlusStat,
  formatRateStat,
  formatWar,
  formatWhip,
} from './statsFormatters';

/** Players the comparison page holds at most: four columns still fit a tablet */
export const MAX_COMPARED = 4;

export type CompareGroup = 'hitting' | 'pitching';

export interface CompareRow {
  key: string;
  label: { zh: string; en: string };
  /** The line the value comes from */
  source: 'season' | 'sabermetrics';
  field: string;
  format: (value: unknown) => string;
  /**
   * Which way is better; null for rows that get no highlight: sample sizes,
   * and counts where fewer is better (strikeouts, losses, walks allowed),
   * which would crown whoever played least. Those are judged by the rate rows.
   */
  better: 'high' | 'low' | null;
}

const count = (value: unknown) => (value === undefined || value === null || value === '' ? '—' : String(value));
const rate = (value: unknown) => formatRateStat(value as string);

const row = (
  key: string,
  zh: string,
  en: string,
  better: CompareRow['better'],
  format: CompareRow['format'] = count,
  source: CompareRow['source'] = 'season',
  field: string = key
): CompareRow => ({ key, label: { zh, en }, source, field, format, better });

export const COMPARE_ROWS: Record<CompareGroup, CompareRow[]> = {
  hitting: [
    row('gamesPlayed', '出賽', 'G', null),
    row('plateAppearances', '打席', 'PA', null),
    row('avg', '打擊率', 'AVG', 'high', rate),
    row('obp', '上壘率', 'OBP', 'high', rate),
    row('slg', '長打率', 'SLG', 'high', rate),
    row('ops', 'OPS', 'OPS', 'high', rate),
    row('homeRuns', '全壘打', 'HR', 'high'),
    row('rbi', '打點', 'RBI', 'high'),
    row('runs', '得分', 'R', 'high'),
    row('hits', '安打', 'H', 'high'),
    row('stolenBases', '盜壘', 'SB', 'high'),
    row('baseOnBalls', '保送', 'BB', 'high'),
    row('strikeOuts', '三振', 'SO', null),
    row('wRcPlus', 'wRC+', 'wRC+', 'high', (v) => formatPlusStat(v as number), 'sabermetrics'),
    row('war', 'WAR', 'WAR', 'high', (v) => formatWar(v as number), 'sabermetrics'),
  ],
  pitching: [
    row('gamesPitched', '出賽', 'G', null),
    row('gamesStarted', '先發', 'GS', null),
    row('inningsPitched', '局數', 'IP', null),
    row('wins', '勝', 'W', 'high'),
    row('losses', '敗', 'L', null),
    row('saves', '救援', 'SV', 'high'),
    row('holds', '中繼', 'HLD', 'high'),
    row('era', '防禦率', 'ERA', 'low', (v) => formatEra(v as string)),
    row('whip', 'WHIP', 'WHIP', 'low', (v) => formatWhip(v as string)),
    row('strikeOuts', '三振', 'K', 'high'),
    row('baseOnBalls', '保送', 'BB', null),
    row('homeRuns', '被全壘打', 'HR', null),
    row('strikeoutsPer9Inn', 'K/9', 'K/9', 'high', (v) => formatPer9(v as string)),
    row('walksPer9Inn', 'BB/9', 'BB/9', 'low', (v) => formatPer9(v as string)),
    row('homeRunsPer9', 'HR/9', 'HR/9', 'low', (v) => formatPer9(v as string)),
    row('fip', 'FIP', 'FIP', 'low', (v) => formatFip(v as number), 'sabermetrics'),
    row('war', 'WAR', 'WAR', 'high', (v) => formatWar(v as number), 'sabermetrics'),
  ],
};

/** A player's value for a row: his big league line, the combined one if he changed clubs */
export function compareValue(stats: PlayerStatGroup[] | undefined, group: CompareGroup, r: CompareRow): unknown {
  return getLevelStat(stats, group, r.source, MLB_SPORT_ID)?.[r.field];
}

/** Whether a player has a line in the group at all this season */
export function hasGroupLine(stats: PlayerStatGroup[] | undefined, group: CompareGroup): boolean {
  return getLevelStat(stats, group, 'season', MLB_SPORT_ID) !== undefined;
}

/**
 * Which columns hold the best value of a row (ties all count). None when the
 * row has no better direction or fewer than two players have a value.
 */
export function bestColumns(values: unknown[], r: CompareRow): Set<number> {
  if (!r.better) return new Set();
  const numbers = values.map((v) =>
    r.field === 'inningsPitched' ? outsOf({ inningsPitched: v as string }) : parseFloat(String(v ?? ''))
  );
  const present = numbers.filter((n) => Number.isFinite(n));
  if (present.length < 2) return new Set();
  const best = r.better === 'high' ? Math.max(...present) : Math.min(...present);
  return new Set(numbers.flatMap((n, i) => (n === best ? [i] : [])));
}

/** Player ids from the `players` URL parameter: numbers only, no repeats, at most MAX_COMPARED */
export function parseCompareIds(param: string | null | undefined): number[] {
  const ids = (param ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)].slice(0, MAX_COMPARED);
}

/**
 * Add a player to a comparison list. Already there: unchanged. Full: the
 * oldest makes room, so the player just chosen is always on the page.
 */
export function addToComparison(ids: number[], id: number): number[] {
  if (ids.includes(id)) return ids;
  return [...ids, id].slice(-MAX_COMPARED);
}

/** Pitching when everyone compared is a pitcher, else hitting */
export function defaultCompareGroup(positions: (string | undefined)[]): CompareGroup {
  return positions.length > 0 && positions.every((p) => p === 'Pitcher') ? 'pitching' : 'hitting';
}

/** The list last on the comparison page, so the player page can add to it */
export function loadComparison(): number[] {
  try {
    return parseCompareIds(localStorage.getItem(STORAGE_KEYS.compare));
  } catch {
    return [];
  }
}

export function saveComparison(ids: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.compare, ids.join(','));
  } catch {
    // Storage unavailable: the URL still carries the list
  }
}
