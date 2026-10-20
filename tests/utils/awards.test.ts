import { describe, it, expect } from 'vitest';
import { defaultAwardsSeason, historyBySeason, leagueOf, rowsByPosition } from '../../src/utils/awards';
import { ALL_AWARD_IDS, groupOf } from '../../src/constants/awards';
import type { AwardRecipient } from '../../src/types/awards';

const winner = (id: string, season: string, playerId: number, position: string): AwardRecipient => ({
  id,
  name: id,
  season,
  team: { id: 119 },
  player: { id: playerId, nameFirstLast: `Player ${playerId}`, primaryPosition: { abbreviation: position } },
});

describe('defaultAwardsSeason', () => {
  it('opens on the season just finished from November, the one before until then', () => {
    expect(defaultAwardsSeason(new Date(2026, 10, 13))).toBe(2026);
    expect(defaultAwardsSeason(new Date(2027, 0, 20))).toBe(2026); // January still belongs to 2026
    expect(defaultAwardsSeason(new Date(2026, 9, 20))).toBe(2025);
    expect(defaultAwardsSeason(new Date(2026, 3, 1))).toBe(2025);
  });
});

describe('leagueOf', () => {
  it('reads the league off the award id', () => {
    expect(leagueOf('ALMVP')).toBe('AL');
    expect(leagueOf('NLCSMVP')).toBe('NL');
    expect(leagueOf('WSMVP')).toBeUndefined();
    expect(leagueOf('MLBHOF')).toBeUndefined();
  });
});

describe('rowsByPosition', () => {
  it('lines up both leagues by position, fielding order first, outfielders together', () => {
    const al = [winner('ALSS', '2025', 1, 'OF'), winner('ALSS', '2025', 2, 'C'), winner('ALSS', '2025', 3, 'OF'), winner('ALSS', '2025', 4, 'DH')];
    const nl = [winner('NLSS', '2025', 5, 'UT'), winner('NLSS', '2025', 6, 'C'), winner('NLGG', '2025', 7, 'SP')];
    const rows = rowsByPosition(al, nl);
    expect(rows.map((r) => r.position)).toEqual(['P', 'C', 'OF', 'DH', 'UT']);
    expect(rows[2].al.map((r) => r.player?.id)).toEqual([1, 3]);
    expect(rows[0].nl.map((r) => r.player?.id)).toEqual([7]); // SP reads as P
  });
});

describe('historyBySeason', () => {
  it('groups winners by season, newest first', () => {
    const history = historyBySeason([
      winner('ALGG', '2024', 1, 'SS'),
      winner('ALGG', '2025', 2, 'SS'),
      winner('ALGG', '2024', 3, 'CF'),
    ]);
    expect(history.map((h) => [h.season, h.winners.map((w) => w.player?.id)])).toEqual([
      ['2025', [2]],
      ['2024', [1, 3]],
    ]);
    expect(historyBySeason(undefined)).toEqual([]);
  });
});

describe('award groups', () => {
  it('finds every award id’s group', () => {
    ALL_AWARD_IDS.forEach((id) => expect(groupOf(id), id).toBeDefined());
    expect(groupOf('NLCY')?.key).toBe('cy');
    expect(groupOf('NOPE')).toBeUndefined();
  });
});
