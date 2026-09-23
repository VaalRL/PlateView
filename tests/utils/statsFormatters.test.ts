import { describe, it, expect } from 'vitest';
import {
  formatRateStat,
  formatEra,
  formatWhip,
  formatRecord,
  getOutDots,
  formatWar,
  formatPlusStat,
  formatFip,
  formatWoba,
  formatPer9,
  getPitchingDecision,
  getPitchingDecisions,
  formatDecisionRecord,
} from '../../src/utils/statsFormatters';
import type { PitchingDecisionStat } from '../../src/utils/statsFormatters';

describe('statsFormatters utility tests', () => {
  describe('formatRateStat (AVG / OBP / SLG)', () => {
    it('formats 0.312 to .312 without leading zero', () => {
      expect(formatRateStat(0.312)).toBe('.312');
      expect(formatRateStat('0.312')).toBe('.312');
    });

    it('formats 0 to .000', () => {
      expect(formatRateStat(0)).toBe('.000');
    });

    it('formats >= 1.0 OPS to 1.045', () => {
      expect(formatRateStat(1.045)).toBe('1.045');
    });

    it('handles undefined or null gracefully', () => {
      expect(formatRateStat(undefined)).toBe('---');
      expect(formatRateStat('')).toBe('---');
    });
  });

  describe('formatEra & formatWhip', () => {
    it('formats ERA with two decimal places', () => {
      expect(formatEra(2.153)).toBe('2.15');
      expect(formatEra(0)).toBe('0.00');
      expect(formatEra(undefined)).toBe('---');
    });

    it('formats WHIP with two decimal places', () => {
      expect(formatWhip(0.981)).toBe('0.98');
      expect(formatWhip(undefined)).toBe('---');
    });
  });

  describe('formatRecord', () => {
    it('formats wins and losses correctly', () => {
      expect(formatRecord(15, 4)).toBe('15-4');
      expect(formatRecord(undefined, 2)).toBe('-');
    });
  });

  describe('getOutDots', () => {
    it('returns correct boolean triplet for out counts', () => {
      expect(getOutDots(0)).toEqual([false, false, false]);
      expect(getOutDots(1)).toEqual([true, false, false]);
      expect(getOutDots(2)).toEqual([true, true, false]);
      expect(getOutDots(3)).toEqual([true, true, true]);
    });
  });

  describe('formatWar, formatPlusStat, formatFip, formatWoba, formatPer9', () => {
    it('formats WAR with one decimal place', () => {
      expect(formatWar(4.24)).toBe('4.2');
      expect(formatWar(-0.32)).toBe('-0.3');
      expect(formatWar(undefined)).toBe('---');
    });

    it('formats plus stats rounded to integer', () => {
      expect(formatPlusStat(149.578)).toBe('150');
      expect(formatPlusStat(95.4)).toBe('95');
      expect(formatPlusStat(undefined)).toBe('---');
    });

    it('formats FIP with two decimal places', () => {
      expect(formatFip(2.959)).toBe('2.96');
      expect(formatFip(undefined)).toBe('---');
    });

    it('formats wOBA with 3 decimal places without leading zero', () => {
      expect(formatWoba(0.3854)).toBe('.385');
      expect(formatWoba(undefined)).toBe('---');
    });

    it('formats Per9 with 2 decimal places', () => {
      expect(formatPer9(10.864)).toBe('10.86');
      expect(formatPer9(undefined)).toBe('---');
    });
  });

  describe('getPitchingDecision (game log Dec column)', () => {
    it('returns W when the pitcher took the win', () => {
      expect(getPitchingDecision({ wins: 1, losses: 0, saves: 0, holds: 0, blownSaves: 0 })).toBe('W');
    });

    it('returns L when the pitcher took the loss', () => {
      expect(getPitchingDecision({ wins: 0, losses: 1, saves: 0, holds: 0, blownSaves: 0 })).toBe('L');
    });

    it('returns SV for a save and HLD for a hold', () => {
      expect(getPitchingDecision({ wins: 0, losses: 0, saves: 1, holds: 0, blownSaves: 0 })).toBe('SV');
      expect(getPitchingDecision({ wins: 0, losses: 0, saves: 0, holds: 1, blownSaves: 0 })).toBe('HLD');
    });

    it('returns BS for a blown save without a decision', () => {
      expect(getPitchingDecision({ wins: 0, losses: 0, saves: 0, holds: 0, blownSaves: 1 })).toBe('BS');
    });

    it('prefers the actual decision over a blown save on the same appearance', () => {
      expect(getPitchingDecision({ wins: 1, losses: 0, saves: 0, holds: 0, blownSaves: 1 })).toBe('W');
      expect(getPitchingDecision({ wins: 0, losses: 1, saves: 0, holds: 0, blownSaves: 1 })).toBe('L');
    });

    it('returns ND when the pitcher appeared without a decision', () => {
      expect(getPitchingDecision({ wins: 0, losses: 0, saves: 0, holds: 0, blownSaves: 0 })).toBe('ND');
    });

    it('returns ND when only some counters are reported', () => {
      expect(getPitchingDecision({ wins: 0, losses: 0 })).toBe('ND');
    });

    it('returns - when no decision data exists at all', () => {
      expect(getPitchingDecision(undefined)).toBe('-');
      expect(getPitchingDecision(null)).toBe('-');
      expect(getPitchingDecision({})).toBe('-');
      // A split that carries other pitching stats but no decision counters
      expect(getPitchingDecision({ era: '2.84' } as PitchingDecisionStat)).toBe('-');
    });
  });

  describe('getPitchingDecisions (box score badges)', () => {
    it('reports every decision an outing earned, not just the first', () => {
      // A reliever who coughs up the lead and is then credited with the win
      // carries both counters; the singular helper drops the blown save
      const vultureWin: PitchingDecisionStat = { wins: 1, blownSaves: 1, losses: 0, saves: 0, holds: 0 };

      expect(getPitchingDecisions(vultureWin)).toEqual(['W', 'BS']);
      expect(getPitchingDecision(vultureWin)).toBe('W');
    });

    it('orders them W, L, SV, HLD, BS', () => {
      expect(getPitchingDecisions({ holds: 1, blownSaves: 1 })).toEqual(['HLD', 'BS']);
    });

    it('returns nothing for a no-decision outing', () => {
      expect(getPitchingDecisions({ wins: 0, losses: 0, saves: 0, holds: 0, blownSaves: 0 })).toEqual(
        []
      );
    });

    it('returns nothing when the stat block has no counters at all', () => {
      expect(getPitchingDecisions(undefined)).toEqual([]);
      expect(getPitchingDecisions(null)).toEqual([]);
      expect(getPitchingDecisions({})).toEqual([]);
    });

    it('keeps the single-label helper behaving exactly as before', () => {
      expect(getPitchingDecision({ saves: 1 })).toBe('SV');
      // Counters present but none fired is a no-decision, not "no data"
      expect(getPitchingDecision({ wins: 0, losses: 0 })).toBe('ND');
      expect(getPitchingDecision({})).toBe('-');
      expect(getPitchingDecision(undefined)).toBe('-');
    });
  });

  describe('formatDecisionRecord (season tally beside a badge)', () => {
    it('quotes a win or a loss as the season record', () => {
      expect(formatDecisionRecord('W', { wins: 12, losses: 6 })).toBe('12-6');
      expect(formatDecisionRecord('L', { wins: 4, losses: 9 })).toBe('4-9');
    });

    it('quotes a save, hold or blown save as a single tally', () => {
      expect(formatDecisionRecord('SV', { saves: 28 })).toBe('28');
      expect(formatDecisionRecord('HLD', { holds: 12 })).toBe('12');
      expect(formatDecisionRecord('BS', { blownSaves: 3 })).toBe('3');
    });

    it('stays empty rather than inventing a record it cannot read', () => {
      expect(formatDecisionRecord('W', { wins: 12 })).toBe('');
      expect(formatDecisionRecord('SV', {})).toBe('');
      expect(formatDecisionRecord('W', undefined)).toBe('');
      expect(formatDecisionRecord('ND', { wins: 1, losses: 1 })).toBe('');
    });
  });
});
