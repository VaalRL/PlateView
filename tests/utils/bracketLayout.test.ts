import { describe, it, expect } from 'vitest';
import { layoutBracket, type BracketLayout } from '../../src/utils/bracketLayout';
import { buildPostseasonBracket, type PostseasonBracket } from '../../src/utils/postseason';
import type { PostseasonSeriesResponse } from '../../src/types/postseason';
import type { StandingsResponse } from '../../src/types/mlb';
// Real statsapi responses, trimmed with the same `fields=` the app requests
import ps2012 from '../fixtures/postseason-2012.json';
import ps2020 from '../fixtures/postseason-2020.json';
import ps2025 from '../fixtures/postseason-2025.json';
import ps2026 from '../fixtures/postseason-2026.json';
import st2025 from '../fixtures/standings-2025.json';

const bracketOf = (series: unknown, standings?: unknown): PostseasonBracket =>
  buildPostseasonBracket(series as PostseasonSeriesResponse, standings as StandingsResponse | undefined)!;

const slotOf = (layout: BracketLayout, seriesId: string, teamId: number) =>
  layout.slots.find((s) => s.seriesId === seriesId && s.team.id === teamId)!;

const slotsIn = (layout: BracketLayout, seriesId: string) => layout.slots.filter((s) => s.seriesId === seriesId);

describe('layoutBracket', () => {
  const layout2025 = layoutBracket(bracketOf(ps2025, st2025));

  it('gives every team in every series its own tile', () => {
    // Per league: 4 wild card + 4 division series + 2 championship series tiles; plus 2 in the World Series
    expect(layout2025.slots).toHaveLength(2 * (4 + 4 + 2) + 2);
    expect(layout2025.markers.map((m) => m.series.id).sort()).toEqual(
      ['D_1', 'D_2', 'D_3', 'D_4', 'F_1', 'F_2', 'F_3', 'F_4', 'L_1', 'L_2', 'W_1'].sort()
    );
  });

  it('puts the AL on the left, the NL on the right and the World Series between', () => {
    const center = layout2025.width / 2;
    const alWildCard = slotsIn(layout2025, 'F_1')[0];
    const nlWildCard = slotsIn(layout2025, 'F_3')[0];
    expect(alWildCard.x).toBeLessThan(center);
    expect(nlWildCard.x).toBeGreaterThan(center);
    expect(layout2025.champion.x).toBe(center);
    // Each round further from the center
    const x = (id: string) => slotsIn(layout2025, id)[0].x;
    expect(x('F_1')).toBeLessThan(x('D_1'));
    expect(x('D_1')).toBeLessThan(x('L_1'));
    expect(x('F_3')).toBeGreaterThan(x('D_3'));
  });

  it('places a bye seed straight into the division series column', () => {
    // Blue Jays (AL #1) and Mariners (AL #2) skipped the wild card round
    expect(layout2025.slots.filter((s) => s.team.id === 141).map((s) => s.seriesId)).not.toContain('F_1');
    expect(slotOf(layout2025, 'D_1', 141).x).toBe(slotsIn(layout2025, 'D_2')[0].x);
  });

  it('lines a team up with the middle of the series it came through', () => {
    // Yankees won F_2 (BOS v NYY) and moved into D_1
    const [a, b] = slotsIn(layout2025, 'F_2');
    expect(slotOf(layout2025, 'D_1', 147).y).toBe((a.y + b.y) / 2);
  });

  it('draws the team that came through a series above the bye it meets', () => {
    expect(slotOf(layout2025, 'D_1', 147).y).toBeLessThan(slotOf(layout2025, 'D_1', 141).y);
  });

  it('marks the teams a series knocked out', () => {
    expect(slotOf(layout2025, 'F_2', 111).eliminated).toBe(true); // Red Sox
    expect(slotOf(layout2025, 'F_2', 147).eliminated).toBe(false);
  });

  it('crowns the World Series winner', () => {
    expect(layout2025.champion.team?.id).toBe(119);
  });

  it('labels each column with its round and series length', () => {
    const al = layout2025.columns.filter((c) => c.league === 'AL').map((c) => [c.round, c.bestOf]);
    expect(al).toEqual([
      ['F', 3],
      ['D', 5],
      ['L', 7],
    ]);
  });

  it('handles the 2020 bracket, where eight teams per league started in the wild card round', () => {
    const layout = layoutBracket(bracketOf(ps2020));
    const alWildCardTiles = layout.slots.filter((s) => s.seriesId.startsWith('F_') && s.x < layout.width / 2);
    expect(alWildCardTiles).toHaveLength(8);
  });

  it('handles the one-game wild card era (2012)', () => {
    const layout = layoutBracket(bracketOf(ps2012));
    expect(layout.columns.find((c) => c.round === 'F' && c.league === 'AL')?.bestOf).toBe(1);
    expect(layout.champion.team?.id).toBe(137); // Giants
  });

  it('leaves the champion open and keeps placeholders before the postseason starts', () => {
    const layout = layoutBracket(bracketOf(ps2026));
    expect(layout.champion.team).toBeNull();
    expect(layout.slots.some((s) => s.team.isPlaceholder)).toBe(true);
    expect(layout.slots.every((s) => !s.eliminated)).toBe(true);
  });

  it('keeps every tile inside the canvas', () => {
    for (const s of layout2025.slots) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(layout2025.width);
      expect(s.y).toBeGreaterThan(0);
      expect(s.y).toBeLessThan(layout2025.height);
    }
  });
});
