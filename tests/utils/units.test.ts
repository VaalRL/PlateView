import { describe, it, expect } from 'vitest';
import { heightToCm, lbsToKg, formatPhysique } from '../../src/utils/units';

describe('units', () => {
  describe('heightToCm', () => {
    it('converts the MLB API feet/inches string', () => {
      expect(heightToCm(`6' 2"`)).toBe(188);
      expect(heightToCm(`5' 10"`)).toBe(178);
      expect(heightToCm(`6' 7"`)).toBe(201);
    });

    it('handles zero inches and a missing inch part', () => {
      expect(heightToCm(`6' 0"`)).toBe(183);
      expect(heightToCm(`6'`)).toBe(183);
    });

    it('returns null for missing or unparseable values', () => {
      expect(heightToCm(undefined)).toBeNull();
      expect(heightToCm('')).toBeNull();
      expect(heightToCm('188 cm')).toBeNull();
    });
  });

  describe('lbsToKg', () => {
    it('converts pounds to whole kilograms', () => {
      expect(lbsToKg(243)).toBe(110);
      expect(lbsToKg(210)).toBe(95);
      expect(lbsToKg(180)).toBe(82);
    });

    it('returns null for missing or invalid values', () => {
      expect(lbsToKg(undefined)).toBeNull();
      expect(lbsToKg(null)).toBeNull();
      expect(lbsToKg(0)).toBeNull();
      expect(lbsToKg(NaN)).toBeNull();
    });
  });

  describe('formatPhysique', () => {
    it('puts metric first in Chinese', () => {
      expect(formatPhysique(`6' 2"`, 243, 'zh')).toBe(`188 cm / 110 kg（6' 2" / 243 lbs）`);
    });

    it('puts imperial first in English', () => {
      expect(formatPhysique(`6' 2"`, 243, 'en')).toBe(`6' 2" / 243 lbs (188 cm / 110 kg)`);
    });

    it('falls back to imperial only when height is unparseable', () => {
      expect(formatPhysique('unknown', 243, 'zh')).toBe('unknown / 243 lbs');
    });
  });
});
