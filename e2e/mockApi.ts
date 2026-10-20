import type { Page } from '@playwright/test';
import standings from '../tests/fixtures/standings-2026.json' with { type: 'json' };
import postseason from '../tests/fixtures/postseason-2025.json' with { type: 'json' };
import promoted from '../tests/fixtures/player-promoted-serven.json' with { type: 'json' };
import rochester from '../tests/fixtures/team-rochester.json' with { type: 'json' };

/**
 * Small, plausible answers for every MLB Stats API endpoint the pages call,
 * so each page renders real content without the network. Anything not
 * matched gets `{}`, the way an empty answer would look.
 */

const today = new Date().toISOString().slice(0, 10);

const game = {
  gamePk: 776633,
  gameType: 'R',
  season: today.slice(0, 4),
  gameDate: `${today}T00:10:00Z`,
  officialDate: today,
  status: { abstractGameState: 'Final', detailedState: 'Final', codedGameState: 'F', statusCode: 'F' },
  teams: {
    away: { score: 5, isWinner: true, team: { id: 140, name: 'Texas Rangers' }, leagueRecord: { wins: 80, losses: 70 } },
    home: { score: 3, isWinner: false, team: { id: 119, name: 'Los Angeles Dodgers' }, leagueRecord: { wins: 95, losses: 55 } },
  },
  venue: { id: 22, name: 'Dodger Stadium' },
  decisions: { winner: { id: 90, fullName: 'Nathan Eovaldi' }, loser: { id: 80, fullName: 'Home Starter' } },
  linescore: {
    currentInning: 9,
    innings: [{ num: 1, away: { runs: 2, hits: 3, errors: 0 }, home: { runs: 0, hits: 1, errors: 0 } }],
    teams: { away: { runs: 5, hits: 9, errors: 0 }, home: { runs: 3, hits: 6, errors: 1 } },
  },
};
const schedule = { dates: [{ date: today, games: [game] }] };

const batter = (id: number, fullName: string, slot: number, position: string) => ({
  person: { id, fullName },
  position: { abbreviation: position },
  allPositions: [{ abbreviation: position }],
  battingOrder: `${slot}00`,
  stats: { batting: { atBats: 4, runs: 1, hits: 2, rbi: 1, baseOnBalls: 0, strikeOuts: 1 } },
  seasonStats: { batting: { avg: '.288', ops: '.850', homeRuns: 20 }, fielding: { fielding: '.985', errors: 3 } },
});
const pitcher = (id: number, fullName: string) => ({
  person: { id, fullName },
  position: { abbreviation: 'P' },
  allPositions: [{ abbreviation: 'P' }],
  stats: { pitching: { inningsPitched: '7.0', hits: 4, runs: 3, earnedRuns: 3, baseOnBalls: 1, strikeOuts: 8 } },
  seasonStats: { pitching: { era: '3.12', wins: 12, losses: 6 } },
});
const POSITIONS = ['SS', 'C', '1B', '2B', '3B', 'LF', 'CF', 'RF', 'DH'];
const side = (teamId: number, name: string, base: number, lead: string) => {
  const hitters = POSITIONS.map((pos, i) => batter(base + i, i === 0 ? lead : `${name} ${i + 1}`, i + 1, pos));
  return {
    team: { id: teamId, name },
    batters: hitters.map((h) => h.person.id),
    pitchers: [base + 90],
    bench: [],
    bullpen: [],
    battingOrder: hitters.map((h) => h.person.id),
    players: Object.fromEntries([
      ...hitters.map((h) => [`ID${h.person.id}`, h]),
      [`ID${base + 90}`, pitcher(base + 90, `${name} Starter`)],
    ]),
    teamStats: { batting: { hits: 9, homeRuns: 1, rbi: 5 }, pitching: { inningsPitched: '9.0', strikeOuts: 8, era: '3.12' } },
  };
};
const boxscore = {
  teams: { away: side(140, 'Texas Rangers', 1000, 'Corey Seager'), home: side(119, 'Los Angeles Dodgers', 2000, 'Mookie Betts') },
};

const hitterLine = (id: number, fullName: string, team: { id: number; name: string }) => ({
  id,
  fullName,
  primaryPosition: { abbreviation: 'RF', type: 'Outfielder' },
  currentTeam: team,
  stats: [
    {
      group: { displayName: 'hitting' },
      type: { displayName: 'season' },
      splits: [{ stat: { gamesPlayed: 150, plateAppearances: 650, avg: '.300', obp: '.400', slg: '.600', ops: '1.000', homeRuns: 45 } }],
    },
  ],
});
const people = {
  people: [
    hitterLine(660271, 'Shohei Ohtani', { id: 119, name: 'Los Angeles Dodgers' }),
    hitterLine(592450, 'Aaron Judge', { id: 147, name: 'New York Yankees' }),
  ],
};

const leaders = {
  leagueLeaders: ['battingAverage', 'homeRuns', 'earnedRunAverage', 'strikeouts'].map((category) => ({
    leaderCategory: category,
    statGroup: category === 'earnedRunAverage' || category === 'strikeouts' ? 'pitching' : 'hitting',
    season: today.slice(0, 4),
    leaders: [
      { rank: 1, value: '.331', person: { id: 592450, fullName: 'Aaron Judge' }, team: { id: 147, name: 'New York Yankees' } },
    ],
  })),
};

const transactions = {
  transactions: [
    {
      id: 1,
      typeCode: 'TR',
      typeDesc: 'Trade',
      date: today,
      person: { id: 500001, fullName: 'Traded Guy' },
      fromTeam: { id: 119, name: 'Los Angeles Dodgers' },
      toTeam: { id: 147, name: 'New York Yankees' },
      description: 'Los Angeles Dodgers traded Traded Guy to New York Yankees.',
    },
  ],
};

const dodgers = {
  teams: [
    {
      id: 119,
      name: 'Los Angeles Dodgers',
      sport: { id: 1 },
      league: { id: 104, name: 'National League' },
      division: { id: 203, name: 'National League West' },
      venue: { id: 22, name: 'Dodger Stadium' },
    },
  ],
};

const award = (id: string, playerId: number, fullName: string, teamId: number) => ({
  awards: [
    {
      id,
      name: id,
      season: '2025',
      team: { id: teamId },
      player: { id: playerId, nameFirstLast: fullName, primaryPosition: { abbreviation: 'OF' } },
    },
  ],
});

/** The answer for one API URL */
export function answer(url: string): unknown {
  const u = decodeURIComponent(url);
  const path = new URL(url).pathname.replace(/^\/api\/v1/, '');
  if (path === '/schedule/postseason/series') return postseason;
  if (path.startsWith('/schedule')) return schedule;
  if (/^\/game\/\d+\/boxscore/.test(path)) return boxscore;
  if (path.startsWith('/standings')) return u.includes('leagueId=103') || u.includes('leagueId=104') ? standings : { records: [] };
  if (path === '/stats/leaders') return leaders;
  if (path === '/stats') return { stats: [{ splits: [] }] };
  if (path === '/transactions') return transactions;
  if (/^\/awards\/[A-Z]+\/recipients$/.test(path)) {
    const id = path.split('/')[2];
    return id.startsWith('NL') ? award(id, 660271, 'Shohei Ohtani', 119) : award(id, 592450, 'Aaron Judge', 147);
  }
  if (/^\/teams\/534$/.test(path)) return rochester;
  if (/^\/teams\/\d+\/roster/.test(path)) return { roster: [] };
  if (/^\/teams\/\d+$/.test(path)) return dodgers;
  if (/^\/people\/\d+$/.test(path)) {
    if (u.includes('gameType=P') || u.includes('yearByYear')) return { people: [] };
    return promoted;
  }
  if (path === '/people') return people;
  if (/^\/sports\/1\/players$/.test(path)) {
    // Someone with a birthday today, so the home page shows its birthdays line
    const monthDay = new Date().toISOString().slice(5, 10);
    return { people: [{ id: 660271, fullName: 'Shohei Ohtani', birthDate: `1994-${monthDay}`, currentTeam: { id: 119 } }] };
  }
  if (path === '/people/search') return { people: [] };
  return {};
}

/** Answer the API from `answer`, and keep images and third-party assets off the network */
export async function mockApi(page: Page): Promise<void> {
  await page.route('**/statsapi.mlb.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer(route.request().url())) })
  );
  await page.route(/mlbstatic\.com|buymeacoffee\.com|fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
}
