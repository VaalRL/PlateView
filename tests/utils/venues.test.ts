import { describe, it, expect } from 'vitest';
import { bundledFieldInfo } from '../../src/utils/venues';
import { teamsById } from '../../src/utils/teams';
import venuesData from '../../src/data/venues.json';

describe('bundled ballparks', () => {
  it('has a park with fence distances for each of the 30 clubs', () => {
    expect(venuesData.venues).toHaveLength(teamsById.size);
    venuesData.venues.forEach((v) => {
      expect(typeof v.fieldInfo.center, v.name).toBe('number');
      expect(typeof v.fieldInfo.leftLine, v.name).toBe('number');
      expect(typeof v.fieldInfo.rightLine, v.name).toBe('number');
    });
  });

  it('looks a park up by id, and has nothing for one it does not know', () => {
    expect(bundledFieldInfo(22)?.center).toBe(395); // Dodger Stadium
    expect(bundledFieldInfo(3)?.leftLine).toBe(310); // Fenway Park
    expect(bundledFieldInfo(5150)).toBeUndefined();
    expect(bundledFieldInfo(undefined)).toBeUndefined();
  });
});
