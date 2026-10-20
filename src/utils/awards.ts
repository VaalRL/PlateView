import type { AwardRecipient } from '../types/awards';
import { getCurrentMlbSeason } from './season';

/**
 * The season the awards page opens on: the one just finished once its
 * awards are announced in November, the one before until then.
 */
export function defaultAwardsSeason(date: Date = new Date()): number {
  const season = getCurrentMlbSeason(date);
  const month = date.getMonth(); // 0-based: 10 = November
  return month >= 10 || month < 2 ? season : season - 1;
}

/** "AL", "NL" or nothing, from the award id */
export function leagueOf(awardId: string): 'AL' | 'NL' | undefined {
  if (awardId.startsWith('AL')) return 'AL';
  if (awardId.startsWith('NL')) return 'NL';
  return undefined;
}

/** Fielding order, then the hitter-only spots Silver Sluggers add */
const POSITION_ORDER = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'OF', 'DH', 'UT'];

const positionOf = (r: AwardRecipient): string => {
  const abbreviation = r.player?.primaryPosition?.abbreviation ?? '';
  // Pitchers come back as SP / RP, outfielders sometimes as one of LF, CF, RF
  if (abbreviation === 'SP' || abbreviation === 'RP') return 'P';
  return abbreviation;
};

/**
 * A by-position award's winners as rows, one per position, with each
 * league's winners side by side. Positions with several winners (three
 * outfielders) keep them all.
 */
export function rowsByPosition(
  al: AwardRecipient[],
  nl: AwardRecipient[]
): { position: string; al: AwardRecipient[]; nl: AwardRecipient[] }[] {
  const positions = [...new Set([...al, ...nl].map(positionOf))].sort((a, b) => {
    const ia = POSITION_ORDER.indexOf(a);
    const ib = POSITION_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  return positions.map((position) => ({
    position,
    al: al.filter((r) => positionOf(r) === position),
    nl: nl.filter((r) => positionOf(r) === position),
  }));
}

/** An award's history, one season to a group, newest first */
export function historyBySeason(recipients: AwardRecipient[] | undefined): { season: string; winners: AwardRecipient[] }[] {
  const bySeason = new Map<string, AwardRecipient[]>();
  (recipients ?? []).forEach((r) => {
    const list = bySeason.get(r.season);
    if (list) list.push(r);
    else bySeason.set(r.season, [r]);
  });
  return [...bySeason.entries()]
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([season, winners]) => ({ season, winners }));
}
