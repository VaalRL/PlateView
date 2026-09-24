import { describe, it, expect } from 'vitest';
import {
  buildPostseasonBracket,
  computePostseasonSeeds,
  getPostseasonSeasons,
  type BracketSeries,
} from '../../src/utils/postseason';
import type { PostseasonSeriesResponse } from '../../src/types/postseason';
import type { StandingsResponse } from '../../src/types/mlb';
// Real statsapi responses, trimmed with the same `fields=` the app requests
import ps2012 from '../fixtures/postseason-2012.json';
import ps2020 from '../fixtures/postseason-2020.json';
import ps2025 from '../fixtures/postseason-2025.json';
import ps2026 from '../fixtures/postseason-2026.json';
import st2020 from '../fixtures/standings-2020.json';
import st2025 from '../fixtures/standings-2025.json';
import st2026 from '../fixtures/standings-2026.json';

const series = (r: unknown) => r as PostseasonSeriesResponse;
const standings = (r: unknown) => r as StandingsResponse;

/** Team ids on the two sides of a series, top first */
const teamIds = (s: BracketSeries | null | undefined) => [s?.top.id, s?.bottom.id];

describe('computePostseasonSeeds', () => {
  it('ranks division winners, then wild cards, by league rank (2025)', () => {
    const seeds = computePostseasonSeeds(standings(st2025));
    // AL: TOR, SEA, CLE, NYY, BOS, DET
    expect([141, 136, 114, 147, 111, 116].map((id) => seeds.get(id))).toEqual([1, 2, 3, 4, 5, 6]);
    // NL: MIL, PHI, LAD, CHC, SD, CIN
    expect([158, 143, 119, 112, 135, 113].map((id) => seeds.get(id))).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('puts 2020 second-place qualifiers between division winners and wild cards', () => {
    const seeds = computePostseasonSeeds(standings(st2020));
    // AL: TB, OAK, MIN, CLE, NYY, HOU, CWS, TOR
    expect([139, 133, 142, 114, 147, 117, 145, 141].map((id) => seeds.get(id))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it('leaves non-qualifiers unseeded', () => {
    const seeds = computePostseasonSeeds(standings(st2025));
    expect(seeds.get(108)).toBeUndefined(); // Angels
  });
});

describe('buildPostseasonBracket', () => {
  it('returns null when the season has no postseason series', () => {
    expect(buildPostseasonBracket(series({ series: [] }))).toBeNull();
    expect(buildPostseasonBracket(undefined)).toBeNull();
  });

  it('builds the 2025 tree from the World Series down to the wild card round', () => {
    const b = buildPostseasonBracket(series(ps2025), standings(st2025))!;

    expect(b.worldSeries?.winnerId).toBe(119); // Dodgers
    expect(b.worldSeries?.isOver).toBe(true);
    expect(b.worldSeries?.bestOf).toBe(7);

    const alcs = b.AL!;
    expect(alcs.round).toBe('L');
    expect(alcs.league).toBe('AL');
    expect(alcs.winnerId).toBe(141); // Blue Jays

    // ALDS 'A' (NYY v TOR) is fed by the BOS v NYY wild card series
    const dsWithJays = alcs.feeders.find((s) => teamIds(s).includes(141))!;
    expect(dsWithJays.id).toBe('D_1');
    expect(dsWithJays.feeders.map((s) => s.id)).toEqual(['F_2']);

    // ALDS 'B' (DET v SEA) is fed by DET v CLE
    const dsWithTigers = alcs.feeders.find((s) => teamIds(s).includes(116))!;
    expect(dsWithTigers.feeders.map((s) => s.id)).toEqual(['F_1']);
  });

  it('counts series wins from final games only', () => {
    const b = buildPostseasonBracket(series(ps2025))!;
    const ws = b.worldSeries!;
    const dodgers = ws.top.id === 119 ? ws.top : ws.bottom;
    const jays = ws.top.id === 141 ? ws.top : ws.bottom;
    expect([dodgers.wins, jays.wins]).toEqual([4, 3]);
  });

  it('ignores postponed entries when counting wins (2012 ALCS sweep)', () => {
    const b = buildPostseasonBracket(series(ps2012))!;
    const alcs = b.AL!;
    expect(alcs.top.wins + alcs.bottom.wins).toBe(4);
    expect(alcs.winnerId).toBe(116); // Tigers swept the Yankees
  });

  it('links a one-game wild card to whichever division series its winner reached (2012)', () => {
    const b = buildPostseasonBracket(series(ps2012))!;
    const wildCardGame = b.AL!.feeders.flatMap((d) => d.feeders)[0];
    expect(wildCardGame.id).toBe('F_1');
    expect(wildCardGame.bestOf).toBe(1);
    const fedDivisionSeries = b.AL!.feeders.find((d) => d.feeders.includes(wildCardGame))!;
    expect(teamIds(fedDivisionSeries)).toContain(wildCardGame.winnerId);
  });

  it('gives each 2020 division series two wild card feeders', () => {
    const b = buildPostseasonBracket(series(ps2020))!;
    for (const league of [b.AL!, b.NL!]) {
      expect(league.feeders).toHaveLength(2);
      league.feeders.forEach((d) => expect(d.feeders).toHaveLength(2));
    }
  });

  it('marks seeds once the first round is set', () => {
    const b = buildPostseasonBracket(series(ps2025), standings(st2025))!;
    const ws = b.worldSeries!;
    const dodgers = ws.top.id === 119 ? ws.top : ws.bottom;
    expect(dodgers.seed).toBe(3);
  });

  describe('a postseason that has not started (2026)', () => {
    const b = buildPostseasonBracket(series(ps2026), standings(st2026))!;
    const alWildCards = b.AL!.feeders.flatMap((d) => d.feeders);

    it('flags placeholder teams instead of treating them as clubs', () => {
      const f1 = alWildCards.find((s) => s.id === 'F_1')!;
      expect(f1.top.isPlaceholder).toBe(true);
      expect(f1.bottom.isPlaceholder).toBe(true);
      expect(f1.top.name).toMatch(/Seed|Wild Card/);

      const f2 = alWildCards.find((s) => s.id === 'F_2')!;
      const yankees = [f2.top, f2.bottom].find((t) => t.id === 147)!;
      expect(yankees.isPlaceholder).toBe(false);
    });

    it('shows no seeds while wild card slots are still undecided', () => {
      const f2 = alWildCards.find((s) => s.id === 'F_2')!;
      expect(f2.top.seed).toBeUndefined();
      expect(f2.bottom.seed).toBeUndefined();
    });

    it('falls back to the 2022+ pairing before any winner exists', () => {
      const feederOf = (dsId: string, league: BracketSeries) =>
        league.feeders.find((d) => d.id === dsId)!.feeders.map((s) => s.id);
      expect(feederOf('D_1', b.AL!)).toEqual(['F_2']);
      expect(feederOf('D_2', b.AL!)).toEqual(['F_1']);
      expect(feederOf('D_3', b.NL!)).toEqual(['F_4']);
      expect(feederOf('D_4', b.NL!)).toEqual(['F_3']);
    });

    it('reports every series as not over with no wins', () => {
      expect(b.worldSeries?.isOver).toBe(false);
      expect(b.worldSeries?.winnerId).toBeNull();
      expect(alWildCards.every((s) => s.top.wins === 0 && s.bottom.wins === 0)).toBe(true);
    });
  });
});

describe('getPostseasonSeasons', () => {
  it('lists seasons from the current one back to 2012', () => {
    const seasons = getPostseasonSeasons(2026);
    expect(seasons[0]).toBe(2026);
    expect(seasons.at(-1)).toBe(2012);
    expect(seasons).toHaveLength(15);
  });
});
