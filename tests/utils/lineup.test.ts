import { describe, it, expect } from 'vitest';
import {
  parseBattingOrder,
  getPositionNumber,
  buildLineup,
  buildFieldAlignment,
  findDesignatedHitter,
} from '../../src/utils/lineup';

/**
 * Mirrors the /game/{gamePk}/boxscore team block: the 4th slot was started by a
 * left fielder who was pinch-hit for, and the pinch hitter stayed in the game.
 */
const teamBox = {
  batters: [11, 12, 13, 14],
  pitchers: [90, 91],
  bench: [15],
  players: {
    ID11: {
      person: { id: 11, fullName: 'Leadoff Shortstop' },
      jerseyNumber: '2',
      position: { abbreviation: 'SS' },
      allPositions: [{ abbreviation: 'SS' }],
      battingOrder: '100',
      stats: { batting: { atBats: 4, hits: 2 } },
      seasonStats: { batting: { avg: '.301' } },
    },
    ID12: {
      person: { id: 12, fullName: 'Second Catcher' },
      position: { abbreviation: 'C' },
      allPositions: [{ abbreviation: 'C' }],
      battingOrder: '200',
    },
    ID13: {
      person: { id: 13, fullName: 'Third Dh' },
      position: { abbreviation: 'DH' },
      allPositions: [{ abbreviation: 'DH' }],
      battingOrder: '300',
    },
    ID14: {
      person: { id: 14, fullName: 'Starting Leftfielder' },
      position: { abbreviation: 'LF' },
      allPositions: [{ abbreviation: 'LF' }],
      battingOrder: '400',
    },
    ID15: {
      person: { id: 15, fullName: 'Pinch Hitter' },
      position: { abbreviation: 'LF' },
      allPositions: [{ abbreviation: 'PH' }, { abbreviation: 'LF' }],
      battingOrder: '401',
    },
    ID90: {
      person: { id: 90, fullName: 'Starting Pitcher' },
      position: { abbreviation: 'P' },
      allPositions: [{ abbreviation: 'P' }],
    },
    ID91: {
      person: { id: 91, fullName: 'Relief Pitcher' },
      position: { abbreviation: 'P' },
      allPositions: [{ abbreviation: 'P' }],
    },
  },
};

describe('parseBattingOrder', () => {
  it('splits the slot from the substitution sequence', () => {
    expect(parseBattingOrder('100')).toEqual({ slot: 1, sequence: 0 });
    expect(parseBattingOrder('401')).toEqual({ slot: 4, sequence: 1 });
    expect(parseBattingOrder('902')).toEqual({ slot: 9, sequence: 2 });
  });

  it('accepts the numeric form the API sometimes returns', () => {
    expect(parseBattingOrder(500)).toEqual({ slot: 5, sequence: 0 });
  });

  it('returns null for players who never entered the batting order', () => {
    expect(parseBattingOrder(undefined)).toBeNull();
    expect(parseBattingOrder(null)).toBeNull();
    expect(parseBattingOrder('')).toBeNull();
    expect(parseBattingOrder('abc')).toBeNull();
    expect(parseBattingOrder('0')).toBeNull();
    // A slot outside 1-9 is not a lineup position
    expect(parseBattingOrder('1000')).toBeNull();
  });
});

describe('getPositionNumber', () => {
  it('maps abbreviations to scorekeeping numbers', () => {
    expect(getPositionNumber('P')).toBe(1);
    expect(getPositionNumber('C')).toBe(2);
    expect(getPositionNumber('SS')).toBe(6);
    expect(getPositionNumber('RF')).toBe(9);
  });

  it('returns null for the designated hitter and unknown inputs', () => {
    expect(getPositionNumber('DH')).toBeNull();
    expect(getPositionNumber('PH')).toBeNull();
    expect(getPositionNumber(undefined)).toBeNull();
  });
});

describe('buildLineup', () => {
  it('groups players into slots ordered 1-9', () => {
    const lineup = buildLineup(teamBox);
    expect(lineup.map((s) => s.slot)).toEqual([1, 2, 3, 4]);
  });

  it('chains a slot starter ahead of its substitutes', () => {
    const fourth = buildLineup(teamBox).find((s) => s.slot === 4);
    expect(fourth?.entries.map((e) => e.fullName)).toEqual([
      'Starting Leftfielder',
      'Pinch Hitter',
    ]);
    expect(fourth?.entries[0].isStarter).toBe(true);
    expect(fourth?.entries[1].isStarter).toBe(false);
    expect(fourth?.entries[1].allPositions).toEqual(['PH', 'LF']);
  });

  it('leaves out pitchers who never batted', () => {
    const ids = buildLineup(teamBox).flatMap((s) => s.entries.map((e) => e.personId));
    expect(ids).not.toContain(90);
    expect(ids).not.toContain(91);
  });

  it('returns an empty lineup when the box score has no players yet', () => {
    expect(buildLineup(undefined)).toEqual([]);
    expect(buildLineup({ players: {} })).toEqual([]);
  });
});

describe('buildFieldAlignment', () => {
  it('puts the current occupant of each slot at their position', () => {
    const alignment = buildFieldAlignment(teamBox);
    expect(alignment.SS?.fullName).toBe('Leadoff Shortstop');
    expect(alignment.SS?.positionNumber).toBe(6);
    expect(alignment.C?.fullName).toBe('Second Catcher');
  });

  it('shows the substitute, not the starter, once a slot has turned over', () => {
    const alignment = buildFieldAlignment(teamBox);
    expect(alignment.LF?.fullName).toBe('Pinch Hitter');
    expect(alignment.LF?.isSubstitute).toBe(true);
  });

  it('reads the pitcher from the tail of `pitchers`, since a DH game keeps him out of the order', () => {
    const alignment = buildFieldAlignment(teamBox);
    expect(alignment.P?.fullName).toBe('Relief Pitcher');
    expect(alignment.P?.positionNumber).toBe(1);
    expect(alignment.P?.battingSlot).toBeNull();
  });

  it('keeps the designated hitter off the field', () => {
    const alignment = buildFieldAlignment(teamBox);
    expect(Object.values(alignment).some((f) => f.personId === 13)).toBe(false);
    expect(findDesignatedHitter(teamBox)?.fullName).toBe('Third Dh');
  });

  it('tolerates a missing box score', () => {
    expect(buildFieldAlignment(undefined)).toEqual({});
  });
});

/**
 * A second-baseman swap, in the three shapes it actually reaches the box score.
 * Only one player may occupy a position at a time, so the chart must resolve to
 * the current occupant even though the lineup carries two players listed 2B.
 */
describe('buildFieldAlignment when a second baseman is replaced mid-game', () => {
  const straightSwap = {
    pitchers: [90],
    players: {
      ID40: {
        person: { id: 40, fullName: 'Starter Secondbase' },
        position: { abbreviation: '2B' },
        allPositions: [{ abbreviation: '2B' }],
        battingOrder: '400',
      },
      ID41: {
        person: { id: 41, fullName: 'Sub Secondbase' },
        position: { abbreviation: '2B' },
        allPositions: [{ abbreviation: '2B' }],
        battingOrder: '401',
      },
      ID90: { person: { id: 90, fullName: 'Only Pitcher' }, position: { abbreviation: 'P' } },
    },
  };

  it('charts only the current occupant, not both players listed 2B', () => {
    const alignment = buildFieldAlignment(straightSwap);
    expect(alignment['2B']?.fullName).toBe('Sub Secondbase');
    expect(alignment['2B']?.isSubstitute).toBe(true);
    // Exactly one fielder holds the position; the replaced starter is off the field
    expect(Object.values(alignment).filter((f) => f.position === '2B')).toHaveLength(1);
  });

  it('names the player who was replaced, so the chart still tells the story', () => {
    const alignment = buildFieldAlignment(straightSwap);
    expect(alignment['2B']?.replacedName).toBe('Starter Secondbase');
    expect(alignment['2B']?.replacedPersonId).toBe(40);
    // The full chain remains visible through the lineup
    expect(buildLineup(straightSwap)[0].entries.map((e) => e.fullName)).toEqual([
      'Starter Secondbase',
      'Sub Secondbase',
    ]);
  });

  it('keeps both positions right when the starter shifts to short instead', () => {
    const rotation = {
      pitchers: [90],
      players: {
        ID40: {
          person: { id: 40, fullName: 'Moved To Short' },
          position: { abbreviation: 'SS' },
          allPositions: [{ abbreviation: '2B' }, { abbreviation: 'SS' }],
          battingOrder: '400',
        },
        ID60: {
          person: { id: 60, fullName: 'Old Shortstop' },
          position: { abbreviation: 'SS' },
          allPositions: [{ abbreviation: 'SS' }],
          battingOrder: '600',
        },
        ID61: {
          person: { id: 61, fullName: 'New Secondbase' },
          position: { abbreviation: '2B' },
          allPositions: [{ abbreviation: '2B' }],
          battingOrder: '601',
        },
        ID90: { person: { id: 90, fullName: 'Only Pitcher' }, position: { abbreviation: 'P' } },
      },
    };

    const alignment = buildFieldAlignment(rotation);
    expect(alignment.SS?.fullName).toBe('Moved To Short');
    expect(alignment['2B']?.fullName).toBe('New Secondbase');
  });

  it('holds the slot open for a pinch runner MLB has not assigned a position yet', () => {
    const pendingRunner = {
      pitchers: [90],
      players: {
        ID40: {
          person: { id: 40, fullName: 'Starter Secondbase' },
          position: { abbreviation: '2B' },
          allPositions: [{ abbreviation: '2B' }],
          battingOrder: '400',
        },
        ID41: {
          person: { id: 41, fullName: 'Pinch Runner' },
          position: { abbreviation: 'PR' },
          allPositions: [{ abbreviation: 'PR' }],
          battingOrder: '401',
        },
        ID90: { person: { id: 90, fullName: 'Only Pitcher' }, position: { abbreviation: 'P' } },
      },
    };

    const alignment = buildFieldAlignment(pendingRunner);
    // Without the fallback the position would simply go blank mid-inning
    expect(alignment['2B']?.fullName).toBe('Pinch Runner');
    expect(alignment['2B']?.isPending).toBe(true);
    expect(alignment['2B']?.replacedName).toBe('Starter Secondbase');
  });

  it('never lets a pending slot displace a confirmed fielder', () => {
    const pendingCollision = {
      pitchers: [90],
      players: {
        // Slot 4 was the second baseman, now a pinch runner with no position
        ID40: {
          person: { id: 40, fullName: 'Removed Secondbase' },
          position: { abbreviation: '2B' },
          allPositions: [{ abbreviation: '2B' }],
          battingOrder: '400',
        },
        ID41: {
          person: { id: 41, fullName: 'Pinch Runner' },
          position: { abbreviation: 'PR' },
          allPositions: [{ abbreviation: 'PR' }],
          battingOrder: '401',
        },
        // Slot 6 already moved over and is confirmed at second base
        ID60: {
          person: { id: 60, fullName: 'Confirmed Secondbase' },
          position: { abbreviation: '2B' },
          allPositions: [{ abbreviation: 'SS' }, { abbreviation: '2B' }],
          battingOrder: '600',
        },
        ID90: { person: { id: 90, fullName: 'Only Pitcher' }, position: { abbreviation: 'P' } },
      },
    };

    const alignment = buildFieldAlignment(pendingCollision);
    expect(alignment['2B']?.fullName).toBe('Confirmed Secondbase');
    expect(alignment['2B']?.isPending).toBeUndefined();
  });
});
