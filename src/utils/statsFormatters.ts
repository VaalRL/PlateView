/**
 * Format batting average (AVG / OBP / SLG): returns e.g. ".310" or "1.025" or "---"
 */
export function formatRateStat(val?: string | number | null): string {
  if (val === undefined || val === null || val === '') return '---';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '---';
  
  if (num < 1 && num >= 0) {
    return num.toFixed(3).replace(/^0\./, '.');
  }
  return num.toFixed(3);
}

/**
 * Format pitching ERA (e.g. "2.45" or "0.00" or "---")
 */
export function formatEra(era?: string | number | null): string {
  if (era === undefined || era === null || era === '') return '---';
  const num = typeof era === 'string' ? parseFloat(era) : era;
  if (isNaN(num)) return '---';
  return num.toFixed(2);
}

/**
 * Format pitching WHIP (e.g. "0.98" or "---")
 */
export function formatWhip(whip?: string | number | null): string {
  if (whip === undefined || whip === null || whip === '') return '---';
  const num = typeof whip === 'string' ? parseFloat(whip) : whip;
  if (isNaN(num)) return '---';
  return num.toFixed(2);
}

/**
 * Format Pitcher W-L record (e.g. "15-4")
 */
export function formatRecord(wins?: number | null, losses?: number | null): string {
  if (wins === undefined || wins === null || losses === undefined || losses === null) return '-';
  return `${wins}-${losses}`;
}

/**
 * Format Out count dots (0, 1, 2, 3)
 */
export function getOutDots(outs: number = 0): [boolean, boolean, boolean] {
  return [outs >= 1, outs >= 2, outs >= 3];
}

/**
 * Format WAR (Wins Above Replacement, e.g. "4.2" or "-0.3" or "---")
 */
export function formatWar(war?: string | number | null): string {
  if (war === undefined || war === null || war === '') return '---';
  const num = typeof war === 'string' ? parseFloat(war) : war;
  if (isNaN(num)) return '---';
  return num.toFixed(1);
}

/**
 * Format Plus / Normalized Stats (e.g. wRC+, OPS+, FIP+, where 100 is league average, e.g. "151" or "96")
 */
export function formatPlusStat(val?: string | number | null): string {
  if (val === undefined || val === null || val === '') return '---';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '---';
  return String(Math.round(num));
}

/**
 * Format FIP (Fielding Independent Pitching, e.g. "2.96" or "---")
 */
export function formatFip(fip?: string | number | null): string {
  if (fip === undefined || fip === null || fip === '') return '---';
  const num = typeof fip === 'string' ? parseFloat(fip) : fip;
  if (isNaN(num)) return '---';
  return num.toFixed(2);
}

/**
 * Format wOBA (Weighted On-Base Average, e.g. ".385" or "---")
 */
export function formatWoba(woba?: string | number | null): string {
  if (woba === undefined || woba === null || woba === '') return '---';
  const num = typeof woba === 'string' ? parseFloat(woba) : woba;
  if (isNaN(num)) return '---';
  if (num < 1 && num >= 0) {
    return num.toFixed(3).replace(/^0\./, '.');
  }
  return num.toFixed(3);
}

/**
 * Format per 9 innings stats (e.g. K/9, BB/9, e.g. "10.86" or "---")
 */
export function formatPer9(val?: string | number | null): string {
  if (val === undefined || val === null || val === '') return '---';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '---';
  return num.toFixed(2);
}

export interface PitchingDecisionStat {
  wins?: number | null;
  losses?: number | null;
  saves?: number | null;
  holds?: number | null;
  blownSaves?: number | null;
}

const DECISION_COUNTERS: [keyof PitchingDecisionStat, string][] = [
  ['wins', 'W'],
  ['losses', 'L'],
  ['saves', 'SV'],
  ['holds', 'HLD'],
  ['blownSaves', 'BS'],
];

/**
 * Every decision a pitcher earned in one appearance, in W / L / SV / HLD / BS order.
 *
 * More than one can be true at once: a reliever who blows the save and is then
 * credited with the win carries both `blownSaves` and `wins`. Returns an empty
 * array when the stat block has no decision counters at all, and also when it
 * has them but none fired (a no-decision outing).
 */
export function getPitchingDecisions(stat?: PitchingDecisionStat | null): string[] {
  if (!stat) return [];
  return DECISION_COUNTERS.filter(([key]) => (stat[key] ?? 0) > 0).map(([, label]) => label);
}

/**
 * The single headline decision (W / L / SV / HLD / BS / ND) for a pitching game
 * log split, where one compact label per row is all there is room for.
 * Returns "-" when the split carries no decision counters at all.
 *
 * A box score should use `getPitchingDecisions` instead: collapsing to one label
 * silently drops the blown save from a blow-it-then-vulture-the-win outing.
 */
export function getPitchingDecision(stat?: PitchingDecisionStat | null): string {
  if (!stat) return '-';

  const reported = DECISION_COUNTERS.filter(([key]) => typeof stat[key] === 'number');
  if (reported.length === 0) return '-';

  return getPitchingDecisions(stat)[0] ?? 'ND';
}

/**
 * The season tally a box score prints beside a decision, MLB style:
 * `W (12-6)`, `L (4-9)`, `SV (28)`, `HLD (12)`, `BS (3)`.
 * Returns an empty string when the season line does not carry the counter.
 */
export function formatDecisionRecord(
  decision: string,
  seasonStat?: PitchingDecisionStat | null
): string {
  if (!seasonStat) return '';

  const tally = (key: keyof PitchingDecisionStat) =>
    typeof seasonStat[key] === 'number' ? (seasonStat[key] as number) : null;

  if (decision === 'W' || decision === 'L') {
    const wins = tally('wins');
    const losses = tally('losses');
    return wins !== null && losses !== null ? `${wins}-${losses}` : '';
  }

  const single: Record<string, keyof PitchingDecisionStat> = {
    SV: 'saves',
    HLD: 'holds',
    BS: 'blownSaves',
  };
  const key = single[decision];
  if (!key) return '';

  const value = tally(key);
  return value !== null ? String(value) : '';
}
