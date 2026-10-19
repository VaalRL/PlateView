import { describe, it, expect } from 'vitest';
import {
  buildPostseasonLeaders,
  latestPostseasonSeason,
  outsOfInnings,
  teamGamesOf,
  type PostseasonStatSplit,
  type PostseasonStatsResponse,
} from '../../src/utils/postseasonLeaders';

const LAD = 119; // NL
const NYY = 147; // AL

const line = (id: number, team: number, stat: Record<string, string | number>): PostseasonStatSplit => ({
  player: { id, fullName: `Player ${id}` },
  team: { id: team, name: `Team ${team}` },
  stat,
});
const response = (...splits: PostseasonStatSplit[]) => ({ stats: [{ splits }] });

/** The Dodgers played 10 games, the Yankees 4 */
const hitting = response(
  line(1, LAD, { gamesPlayed: 10, plateAppearances: 45, avg: '.300', homeRuns: 4 }),
  line(2, LAD, { gamesPlayed: 6, plateAppearances: 12, avg: '.500', homeRuns: 1 }),
  line(3, NYY, { gamesPlayed: 4, plateAppearances: 14, avg: '.400', homeRuns: 4 }),
  line(4, NYY, { gamesPlayed: 4, plateAppearances: 16, avg: '.250', homeRuns: 0 })
);

const leaders = (stats: PostseasonStatsResponse = hitting, extra: Partial<Parameters<typeof buildPostseasonLeaders>[2]> = {}) =>
  buildPostseasonLeaders(stats, hitting, {
    statGroup: 'hitting',
    categories: ['battingAverage', 'homeRuns'],
    season: 2025,
    ...extra,
  });

describe('teamGamesOf', () => {
  it('takes the most games anyone on the club played', () => {
    expect(teamGamesOf(hitting)).toEqual(
      new Map([
        [LAD, 10],
        [NYY, 4],
      ])
    );
  });
});

describe('buildPostseasonLeaders', () => {
  it('ranks rates only among players with 3.1 plate appearances per club game', () => {
    const avg = leaders()[0];
    // Player 2's .500 in 12 PA falls short of 31; player 3's 14 PA clear the Yankees' 12.4
    expect(avg.leaders.map((l) => [l.rank, l.person.id, l.value])).toEqual([
      [1, 3, '.400'],
      [2, 1, '.300'],
      [3, 4, '.250'],
    ]);
  });

  it('shares a rank between ties and leaves out zero counts', () => {
    const hr = leaders()[1];
    expect(hr.leaders.map((l) => [l.rank, l.person.id])).toEqual([
      [1, 1],
      [1, 3],
      [3, 2],
    ]);
    expect(hr).toMatchObject({ leaderCategory: 'homeRuns', statGroup: 'hitting', season: '2025' });
  });

  it('keeps one league’s clubs', () => {
    expect(leaders(hitting, { leagueId: 103 })[1].leaders.map((l) => l.person.id)).toEqual([3]);
    expect(leaders(hitting, { leagueId: 104 })[1].leaders.map((l) => l.person.id)).toEqual([1, 2]);
  });

  it('ranks pitchers’ rates by innings per club game, lowest ERA first', () => {
    const pitching = response(
      line(10, LAD, { era: '1.50', inningsPitched: '12.0', strikeOuts: 15 }),
      line(11, LAD, { era: '0.00', inningsPitched: '9.2', strikeOuts: 12 }),
      line(12, NYY, { era: '3.00', inningsPitched: '4.1', strikeOuts: 5 })
    );
    const [era, ip] = buildPostseasonLeaders(pitching, hitting, {
      statGroup: 'pitching',
      categories: ['earnedRunAverage', 'inningsPitched'],
      season: 2025,
    });
    // 9.2 innings fall short of the Dodgers' 10; 4.1 clear the Yankees' 4
    expect(era.leaders.map((l) => l.person.id)).toEqual([10, 12]);
    expect(ip.leaders.map((l) => l.value)).toEqual(['12.0', '9.2', '4.1']);
  });

  it('stops at the limit and skips unknown categories', () => {
    const groups = leaders(hitting, { categories: ['homeRuns', 'notACategory'], limit: 1 });
    expect(groups).toHaveLength(1);
    expect(groups[0].leaders).toHaveLength(1);
  });

  it('is empty before any games', () => {
    expect(leaders(response())[0].leaders).toEqual([]);
    expect(leaders({})[1].leaders).toEqual([]);
  });
});

describe('outsOfInnings', () => {
  it('reads thirds of an inning', () => {
    expect(outsOfInnings('9.2')).toBe(29);
    expect(outsOfInnings('12.0')).toBe(36);
    expect(outsOfInnings(undefined)).toBe(0);
  });
});

describe('latestPostseasonSeason', () => {
  it('is this season’s from late September, last season’s before', () => {
    expect(latestPostseasonSeason(new Date(2026, 9, 19))).toBe(2026);
    expect(latestPostseasonSeason(new Date(2026, 8, 25))).toBe(2026);
    expect(latestPostseasonSeason(new Date(2026, 4, 1))).toBe(2025);
    // January still belongs to last season, whose postseason is over
    expect(latestPostseasonSeason(new Date(2027, 0, 10))).toBe(2026);
  });
});
