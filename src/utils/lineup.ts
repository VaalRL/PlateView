import { BoxscoreBattingStats, BoxscoreTeamSide } from '../types/mlb';

/**
 * Pure helpers that turn a `/game/{gamePk}/boxscore` team block into the two
 * shapes the game detail page renders: the batting order (with substitution
 * chains) and the defensive alignment.
 *
 * Everything the MLB API tells us about lineups lives in two undocumented
 * fields, so the parsing is isolated here and locked down by unit tests.
 */

/** Defensive positions in scorekeeping order, 1 through 9. */
export const FIELD_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] as const;

export type FieldPosition = (typeof FIELD_POSITIONS)[number];

const POSITION_NUMBERS: Record<string, number> = {
  P: 1,
  C: 2,
  '1B': 3,
  '2B': 4,
  '3B': 5,
  SS: 6,
  LF: 7,
  CF: 8,
  RF: 9,
};

export interface LineupEntry {
  personId: number;
  fullName: string;
  /** Position held at the end of the game (or right now, while it is live) */
  position: string;
  /** Every position this player covered in the game */
  allPositions: string[];
  jerseyNumber?: string;
  /** 0 for the player who started the slot, 1+ for each later substitute */
  sequence: number;
  isStarter: boolean;
  battingStats?: BoxscoreBattingStats;
  seasonBattingStats?: BoxscoreBattingStats;
}

export interface LineupSlot {
  /** Batting order slot, 1 through 9 */
  slot: number;
  /** Starter first, then each substitute in the order they entered */
  entries: LineupEntry[];
}

export interface Fielder {
  personId: number;
  fullName: string;
  position: FieldPosition;
  /** Scorekeeping number: P is 1, C is 2, ... RF is 9 */
  positionNumber: number;
  jerseyNumber?: string;
  /** Batting order slot, or null for a pitcher who never bats (DH games) */
  battingSlot: number | null;
  isSubstitute: boolean;
}

/**
 * MLB encodes the batting order as a numeric string: the hundreds digit is the
 * slot (1-9) and the last two digits are the position within that slot, where
 * "00" is the player who started there and "01", "02", ... are substitutes.
 * `"401"` therefore means "first substitute in the 4th slot".
 */
export function parseBattingOrder(raw?: string | number | null): { slot: number; sequence: number } | null {
  if (raw === undefined || raw === null || raw === '') return null;

  const value = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(value) || value <= 0) return null;

  const slot = Math.floor(value / 100);
  if (slot < 1 || slot > 9) return null;

  return { slot, sequence: value % 100 };
}

/** Scorekeeping number for a position, or null for DH / PH / PR and unknowns. */
export function getPositionNumber(abbreviation?: string): number | null {
  if (!abbreviation) return null;
  return POSITION_NUMBERS[abbreviation] ?? null;
}

type BoxscoreTeam = BoxscoreTeamSide | null | undefined;

/**
 * Group every player carrying a `battingOrder` into their slot, ordered so the
 * starter comes first and each substitute follows in the order they entered.
 */
export function buildLineup(teamBox: BoxscoreTeam): LineupSlot[] {
  const players = teamBox?.players || {};
  const bySlot = new Map<number, LineupEntry[]>();

  Object.values(players).forEach((p) => {
    const parsed = parseBattingOrder(p?.battingOrder);
    const personId = p?.person?.id;
    if (!parsed || !personId) return;

    const entry: LineupEntry = {
      personId,
      fullName: p.person?.fullName || '',
      position: p.position?.abbreviation || '',
      allPositions: (p.allPositions || [])
        .map((pos) => pos?.abbreviation || '')
        .filter((abbr): abbr is string => abbr.length > 0),
      jerseyNumber: p.jerseyNumber,
      sequence: parsed.sequence,
      isStarter: parsed.sequence === 0,
      battingStats: p.stats?.batting,
      seasonBattingStats: p.seasonStats?.batting,
    };

    const bucket = bySlot.get(parsed.slot);
    if (bucket) bucket.push(entry);
    else bySlot.set(parsed.slot, [entry]);
  });

  return Array.from(bySlot.entries())
    .sort(([a], [b]) => a - b)
    .map(([slot, entries]) => ({
      slot,
      entries: entries.sort((a, b) => a.sequence - b.sequence),
    }));
}

/**
 * Resolve who is standing at each of the nine defensive positions.
 *
 * The boxscore only reports each player's *current* position, so the current
 * occupant of a batting slot is its highest-sequence entry. The pitcher is read
 * from the tail of `pitchers` instead, because in a DH game he never appears in
 * the batting order at all.
 */
export function buildFieldAlignment(teamBox: BoxscoreTeam): Partial<Record<FieldPosition, Fielder>> {
  const alignment: Partial<Record<FieldPosition, Fielder>> = {};

  buildLineup(teamBox).forEach(({ slot, entries }) => {
    const current = entries[entries.length - 1];
    const position = current?.position as FieldPosition | undefined;
    if (!position || !POSITION_NUMBERS[position]) return;

    alignment[position] = {
      personId: current.personId,
      fullName: current.fullName,
      position,
      positionNumber: POSITION_NUMBERS[position],
      jerseyNumber: current.jerseyNumber,
      battingSlot: slot,
      isSubstitute: !current.isStarter,
    };
  });

  // `pitchers` is ordered by appearance, so the last entry is on the mound
  const pitcherIds = teamBox?.pitchers || [];
  const currentPitcherId = pitcherIds[pitcherIds.length - 1];
  if (currentPitcherId) {
    const p = teamBox?.players?.['ID' + currentPitcherId];
    if (p?.person?.id) {
      const parsed = parseBattingOrder(p.battingOrder);
      alignment.P = {
        personId: p.person.id,
        fullName: p.person.fullName || '',
        position: 'P',
        positionNumber: 1,
        jerseyNumber: p.jerseyNumber,
        battingSlot: parsed?.slot ?? null,
        isSubstitute: pitcherIds.length > 1,
      };
    }
  }

  return alignment;
}

/** Designated hitter, when the lineup has one (he holds a slot but no position). */
export function findDesignatedHitter(teamBox: BoxscoreTeam): LineupEntry | null {
  for (const { entries } of buildLineup(teamBox)) {
    const dh = entries.find((e) => e.position === 'DH');
    if (dh) return dh;
  }
  return null;
}
