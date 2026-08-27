import { describe, it, expect } from 'vitest';
import {
  formatRateStat,
  formatEra,
  formatWhip,
  formatRecord,
  getOutDots,
} from '../../src/utils/statsFormatters';

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
});
