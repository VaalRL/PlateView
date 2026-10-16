import type { GameLogSplit } from '../types/favorites';
import { formatEra, formatRateStat, formatRecord, formatWhip } from './statsFormatters';
import { isPostseasonGameType } from './playerLevels';
import { MLB_SPORT_ID } from '../constants/levels';

export interface GameLogFilter {
  gameType: 'all' | 'regular' | 'postseason';
  /** sport id (1 = MLB, 11 = AAA ...) */
  level: number | 'all';
  venue: 'all' | 'home' | 'away';
  opponentId: number | 'all';
  /** YYYY-MM */
  month: string | 'all';
}

export const DEFAULT_GAME_LOG_FILTER: GameLogFilter = {
  gameType: 'all',
  level: 'all',
  venue: 'all',
  opponentId: 'all',
  month: 'all',
};

export function isFilterActive(filter: GameLogFilter): boolean {
  return (Object.keys(DEFAULT_GAME_LOG_FILTER) as (keyof GameLogFilter)[]).some(
    (key) => filter[key] !== DEFAULT_GAME_LOG_FILTER[key]
  );
}

const levelOf = (log: GameLogSplit) => log.sport?.id ?? MLB_SPORT_ID;

export function filterGameLogs(logs: GameLogSplit[], filter: GameLogFilter): GameLogSplit[] {
  return logs.filter((log) => {
    if (filter.gameType === 'regular' && isPostseasonGameType(log.gameType)) return false;
    if (filter.gameType === 'postseason' && !isPostseasonGameType(log.gameType)) return false;
    if (filter.level !== 'all' && levelOf(log) !== filter.level) return false;
    if (filter.venue === 'home' && log.isHome !== true) return false;
    if (filter.venue === 'away' && log.isHome !== false) return false;
    if (filter.opponentId !== 'all' && log.opponent?.id !== filter.opponentId) return false;
    if (filter.month !== 'all' && !log.date.startsWith(filter.month)) return false;
    return true;
  });
}

export interface GameLogFilterOptions {
  hasPostseason: boolean;
  levels: { id: number; abbreviation: string }[];
  opponents: { id: number; name: string }[];
  /** YYYY-MM, newest first */
  months: string[];
}

/** What there is to filter by: only values that occur in the log */
export function getGameLogFilterOptions(logs: GameLogSplit[]): GameLogFilterOptions {
  const levels = new Map<number, string>();
  const opponents = new Map<number, string>();
  const months = new Set<string>();
  logs.forEach((log) => {
    levels.set(levelOf(log), log.sport?.abbreviation ?? 'MLB');
    if (log.opponent?.id !== undefined) opponents.set(log.opponent.id, log.opponent.name ?? String(log.opponent.id));
    if (log.date) months.add(log.date.slice(0, 7));
  });
  return {
    hasPostseason: logs.some((log) => isPostseasonGameType(log.gameType)),
    levels: [...levels.entries()].sort(([a], [b]) => a - b).map(([id, abbreviation]) => ({ id, abbreviation })),
    opponents: [...opponents.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
    months: [...months].sort().reverse(),
  };
}

const sum = (logs: GameLogSplit[], pick: (log: GameLogSplit) => number | null | undefined) =>
  logs.reduce((total, log) => total + (pick(log) ?? 0), 0);

export interface HittingTotals {
  atBats: number;
  runs: number;
  hits: number;
  rbi: number;
  homeRuns: number;
  baseOnBalls: number;
  strikeOuts: number;
  avg: string;
  ops: string;
}

/** Counting stats added up and rates worked out from them, as the season line does */
export function sumHitting(logs: GameLogSplit[]): HittingTotals {
  const atBats = sum(logs, (l) => l.stat?.atBats);
  const hits = sum(logs, (l) => l.stat?.hits);
  const baseOnBalls = sum(logs, (l) => l.stat?.baseOnBalls);
  const hitByPitch = sum(logs, (l) => l.stat?.hitByPitch);
  const sacFlies = sum(logs, (l) => l.stat?.sacFlies);
  const totalBases = sum(logs, (l) => l.stat?.totalBases);
  const obpDenominator = atBats + baseOnBalls + hitByPitch + sacFlies;
  const obp = obpDenominator > 0 ? (hits + baseOnBalls + hitByPitch) / obpDenominator : null;
  const slg = atBats > 0 ? totalBases / atBats : null;
  return {
    atBats,
    runs: sum(logs, (l) => l.stat?.runs),
    hits,
    rbi: sum(logs, (l) => l.stat?.rbi),
    homeRuns: sum(logs, (l) => l.stat?.homeRuns),
    baseOnBalls,
    strikeOuts: sum(logs, (l) => l.stat?.strikeOuts),
    avg: atBats > 0 ? formatRateStat(hits / atBats) : '---',
    ops: obp !== null && slg !== null ? formatRateStat(obp + slg) : '---',
  };
}

/** Outs from a game line: `outs` when given, else innings pitched read as thirds ("5.2" = 17) */
export function outsOf(stat: GameLogSplit['stat'] | undefined): number {
  if (typeof stat?.outs === 'number') return stat.outs;
  const [whole, thirds] = String(stat?.inningsPitched ?? '0').split('.');
  return (parseInt(whole, 10) || 0) * 3 + (parseInt(thirds ?? '0', 10) || 0);
}

export interface PitchingTotals {
  record: string;
  inningsPitched: string;
  hits: number;
  runs: number;
  earnedRuns: number;
  strikeOuts: number;
  baseOnBalls: number;
  era: string;
  whip: string;
}

export function sumPitching(logs: GameLogSplit[]): PitchingTotals {
  const outs = sum(logs, (l) => outsOf(l.stat));
  const hits = sum(logs, (l) => l.stat?.hits);
  const baseOnBalls = sum(logs, (l) => l.stat?.baseOnBalls);
  const earnedRuns = sum(logs, (l) => l.stat?.earnedRuns);
  return {
    record: formatRecord(sum(logs, (l) => l.stat?.wins), sum(logs, (l) => l.stat?.losses)),
    inningsPitched: `${Math.floor(outs / 3)}.${outs % 3}`,
    hits,
    runs: sum(logs, (l) => l.stat?.runs),
    earnedRuns,
    strikeOuts: sum(logs, (l) => l.stat?.strikeOuts),
    baseOnBalls,
    era: outs > 0 ? formatEra((earnedRuns * 27) / outs) : '-.--',
    whip: outs > 0 ? formatWhip(((hits + baseOnBalls) * 3) / outs) : '-.--',
  };
}
