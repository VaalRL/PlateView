/**
 * Live checks that the MLB Stats API still returns what PlateView reads.
 * Each test calls the app's own request function (same URL, same hydrate)
 * and, where the app derives something from the response, runs that too.
 *
 * Fixed past data (the 2025 season, the 2012 ALCS rainout) keeps results
 * stable; checks on the current season only test shape, never values.
 */
import { describe, it, expect } from 'vitest';
import {
  getFavoritePlayersGameLog,
  getGameBoxscore,
  getGameSchedule,
  getLeaderboards,
  getPersonSummary,
  getPlayerDetail,
  getPlayersForComparison,
  getPlayerTransactions,
  getPostseasonGameLogs,
  getPostseasonSeries,
  getSchedule,
  getStandings,
  getTeamDetail,
  getTeamPreviousGame,
  getTeamRoster,
  getTeamSeasonGames,
  getTeamSchedule,
  getVenue,
  searchPeople,
} from '../../src/services/mlbApi';
import { HITTING_LEADER_CATEGORIES, PITCHING_LEADER_CATEGORIES } from '../../src/constants/leaderboards';
import { isPostseasonGameType, type PlayerStatGroup } from '../../src/utils/playerLevels';
import { calledOffReason, isCompletedGame, pickGameEntry, teamResult } from '../../src/utils/gameStatus';
import { findLeaderRanks, findTeamStanding, isMinorLeagueClub, levelAbbreviation } from '../../src/utils/hoverCards';
import { teamDisplayName } from '../../src/utils/teams';
import { sortTransactions, transactionTypeLabel } from '../../src/utils/transactions';
import { buildPostseasonBracket } from '../../src/utils/postseason';
import { MLB_LEVEL } from '../../src/constants/levels';
import { COMPARE_ROWS, compareValue } from '../../src/utils/comparison';
import { getCurrentMlbSeason } from '../../src/utils/season';
import {
  COMPARED_GAME_TYPES,
  DEFENSE_POSITIONS,
  lastCompletedGame,
  startingDefense,
  startingLineup,
  teamSide,
} from '../../src/utils/teamComparison';
import type { GameSchedule, ScheduleResponse } from '../../src/types/mlb';

const DODGERS = 119;
const TIGERS = 116;
const ROCHESTER = 534; // AAA, Nationals affiliate
const NATIONALS = 120;
const OHTANI = 660271;
const JUDGE = 592450;
const DODGER_STADIUM = 22;
const LAST_FULL_SEASON = 2025;

const YMD = /^\d{4}-\d{2}-\d{2}$/;

const gamesOf = (r: ScheduleResponse) => (r.dates ?? []).flatMap((d) => d.games ?? []);
const gameLogOf = (stats: PlayerStatGroup[] | undefined, group: string) =>
  stats?.find((s) => s.group?.displayName === group && s.type?.displayName === 'gameLog')?.splits ?? [];

describe('schedule', () => {
  it('gives every played game a winner and a loser', async () => {
    // A full regular season Saturday
    const games = gamesOf(await getSchedule('2025-07-12'));
    const played = games.filter(isCompletedGame);
    expect(played.length).toBeGreaterThan(5);
    played.forEach((g: GameSchedule) => {
      expect(typeof g.gamePk).toBe('number');
      expect(typeof g.teams.away.score).toBe('number');
      expect(typeof g.teams.home.score).toBe('number');
      const away = teamResult(g, g.teams.away.team.id);
      const home = teamResult(g, g.teams.home.team.id);
      expect([away, home].sort()).toEqual(['L', 'W']);
    });
  });

  it('files a rainout as "Final" without a winner, which the app reads as postponed', async () => {
    // 2012 ALCS Game 4 at Detroit was rained out on Oct 17 and played on Oct 18
    const games = gamesOf(await getTeamSchedule(TIGERS, '2012-10-17', '2012-10-19'));
    const rainout = games.find((g) => /postponed/i.test(g.status.detailedState ?? ''));
    expect(rainout, 'the postponed ALCS Game 4 entry').toBeDefined();
    expect(rainout!.status.abstractGameState).toBe('Final');
    expect(calledOffReason(rainout!.status)).toBe('postponed');
    expect(teamResult(rainout!, TIGERS)).toBeNull();
    expect(rainout!.teams.home.isWinner).not.toBe(true);
    expect(rainout!.teams.away.isWinner).not.toBe(true);
  });
});

describe('game page', () => {
  it('lists a rained-out game twice under one gamePk, and the page picks the one played', async () => {
    // 2012 ALCS Game 4: postponed Oct 17, played Oct 18, both as gamePk 345619
    const entries = gamesOf(await getGameSchedule(345619));
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries.some((g) => calledOffReason(g.status) === 'postponed')).toBe(true);
    const game = pickGameEntry(entries)!;
    expect(isCompletedGame(game)).toBe(true);
    expect(game.linescore?.innings?.length).toBeGreaterThanOrEqual(9);
    expect(typeof game.teams.home.score).toBe('number');
  });

  it('has a box score for both sides', async () => {
    const box = await getGameBoxscore(345619);
    expect(Object.keys(box.teams?.away?.players ?? {}).length).toBeGreaterThan(9);
    expect(Object.keys(box.teams?.home?.players ?? {}).length).toBeGreaterThan(9);
  });

  it('shows the 2026 ALCS Game 4 with its score and linescore', async () => {
    // Reported blank: score "- : -" and no linescore (gamePk 849817)
    const entries = gamesOf(await getGameSchedule(849817));
    console.info(
      'gamePk 849817 entries:',
      entries.map((g) => `${g.officialDate} ${g.status.abstractGameState}/${g.status.detailedState} ` +
        `${g.teams.away.score ?? '-'}:${g.teams.home.score ?? '-'} innings=${g.linescore?.innings?.length ?? 0}`)
    );
    const game = pickGameEntry(entries)!;
    expect(game).toBeDefined();
    if (!isCompletedGame(game)) return; // not played yet: nothing to show
    expect(typeof game.teams.away.score).toBe('number');
    expect(game.linescore?.innings?.length).toBeGreaterThan(0);
  });
});

describe('standings', () => {
  it('ranks all 30 clubs in six divisions with a win percentage', async () => {
    const standings = await getStandings(LAST_FULL_SEASON, MLB_LEVEL.leagueIds);
    expect(standings.records).toHaveLength(6);
    const records = standings.records.flatMap((d) => d.teamRecords);
    expect(records).toHaveLength(30);
    records.forEach((r) => {
      expect(r.divisionRank).toMatch(/^[1-5]$/);
      expect(r.winningPercentage).toMatch(/^(\.\d{3}|1\.000)$/);
      expect(r.wins + r.losses).toBeGreaterThan(150);
    });
    standings.records.forEach((d) => expect(typeof d.division?.id).toBe('number'));
    expect(findTeamStanding(standings, DODGERS)?.team.id).toBe(DODGERS);
  });
});

describe('teams', () => {
  it('names the parent club of a minor league team', async () => {
    const team = (await getTeamDetail(ROCHESTER)).teams[0];
    expect(team.parentOrgId).toBe(NATIONALS);
    expect(typeof team.parentOrgName).toBe('string');
    expect(team.sport.id).toBe(11);
    expect(typeof team.league.name).toBe('string');
  });

  it('lists an active roster with people', async () => {
    const roster = (await getTeamRoster(DODGERS)).roster;
    expect(roster.length).toBeGreaterThan(20);
    roster.forEach((entry: { person: { id: number } }) => expect(typeof entry.person.id).toBe('number'));
  });

  it('has fence distances for a ballpark', async () => {
    const venue = (await getVenue(DODGER_STADIUM)).venues?.[0];
    ['leftLine', 'center', 'rightLine'].forEach((key) =>
      expect(typeof venue?.fieldInfo?.[key as 'center']).toBe('number')
    );
  });
});

describe('players', () => {
  it('returns the player page stats with typed game log rows', async () => {
    const person = (await getPlayerDetail(OHTANI)).people[0];
    expect(person.fullName).toBe('Shohei Ohtani');
    expect(typeof person.height).toBe('string');
    expect(person.height).toMatch(/^\d+' ?\d*"?$/);
    expect(typeof person.weight).toBe('number');
    const groups = (person.stats as PlayerStatGroup[]).map((s) => `${s.group?.displayName}/${s.type?.displayName}`);
    expect(groups).toContain('hitting/season');
    expect(groups).toContain('hitting/career');
    // Rows only exist once the season has started; their shape is checked when they do
    gameLogOf(person.stats, 'hitting').forEach((row) => {
      expect(row.date).toMatch(YMD);
      expect(row.gameType).toBe('R');
      expect(typeof row.game?.gamePk).toBe('number');
    });
  });

  it('returns only postseason games for gameType=P', async () => {
    const people = (await getPostseasonGameLogs([OHTANI], LAST_FULL_SEASON)).people;
    const rows = gameLogOf(people[0].stats, 'hitting');
    expect(rows.length).toBeGreaterThan(5);
    rows.forEach((row) => {
      expect(isPostseasonGameType(row.gameType)).toBe(true);
      expect(row.date).toMatch(YMD);
      expect(typeof row.game?.gamePk).toBe('number');
    });
  });

  it('batches favorites with their current club', async () => {
    const people = (await getFavoritePlayersGameLog([OHTANI, JUDGE])).people;
    expect(people.map((p) => p.id).sort()).toEqual([JUDGE, OHTANI].sort());
    people.forEach((p) => expect(typeof p.currentTeam?.id).toBe('number'));
  });

  it('gives the hover card a big leaguer’s current club', async () => {
    const team = (await getPersonSummary(OHTANI)).people[0].currentTeam;
    expect(team?.id).toBe(DODGERS);
    // No `sport` here for a big league club, so the card tells levels apart by id
    expect(isMinorLeagueClub(team?.id)).toBe(false);
  });

  it('gives the hover card a minor leaguer’s club and its parent', async () => {
    // Whoever is on Rochester's roster now; the roster can be empty between seasons
    const roster: { person: { id: number } }[] = (await getTeamRoster(ROCHESTER)).roster ?? [];
    if (roster.length === 0) {
      console.info('Rochester has no active roster today; minor leaguer hover card not checked');
      return;
    }
    const team = (await getPersonSummary(roster[0].person.id)).people[0].currentTeam;
    expect(isMinorLeagueClub(team?.id)).toBe(true);
    // Only the parent's id comes with it (no parentOrgName, no sport); the
    // card names the parent from that id and reads the level off the club
    expect(team?.parentOrgId).toBe(NATIONALS);
    expect(teamDisplayName(team?.parentOrgId, 'en')).toBe('Washington Nationals');
    expect(levelAbbreviation((await getTeamDetail(team!.id!)).teams[0].sport.id)).toBe('AAA');
  });

  it('finds players by name', async () => {
    const people: { id: number }[] = (await searchPeople('Ohtani')).people ?? [];
    expect(people.map((p) => p.id)).toContain(OHTANI);
  });
});

describe('player comparison', () => {
  it('has a value for every row of the comparison table', async () => {
    const SKENES = 694973;
    const people = (await getPlayersForComparison([OHTANI, JUDGE, SKENES], LAST_FULL_SEASON)).people;
    const byId = new Map(people.map((p) => [p.id, p.stats as PlayerStatGroup[]]));
    const missing = (id: number, group: 'hitting' | 'pitching') =>
      COMPARE_ROWS[group].filter((r) => compareValue(byId.get(id), group, r) === undefined).map((r) => r.key);
    expect(missing(JUDGE, 'hitting')).toEqual([]);
    expect(missing(SKENES, 'pitching')).toEqual([]);
    expect(people.find((p) => p.id === SKENES)?.primaryPosition?.type).toBe('Pitcher');
  });
});

describe('team comparison', () => {
  it('finds a club’s last game of a season with the trimmed schedule', async () => {
    const schedule = await getTeamSeasonGames(DODGERS, LAST_FULL_SEASON);
    const games = gamesOf(schedule);
    games.forEach((g) => expect(COMPARED_GAME_TYPES).toContain(g.gameType));
    // No spring training, the full regular season
    expect(games.filter((g) => g.gameType === 'R' && isCompletedGame(g)).length).toBeGreaterThanOrEqual(160);

    // Game 7 of the 2025 World Series, on November 1
    const last = lastCompletedGame(schedule, DODGERS)!;
    expect(last.gameType).toBe('W');
    expect(last.officialDate).toBe('2025-11-01');
    expect(typeof last.teams.home.score).toBe('number');
    expect(typeof last.teams.away.team.name).toBe('string');
    expect(teamResult(last, DODGERS)).toBe('W');
  });

  it('reads who started where from that game’s boxscore', async () => {
    const previous = (await getTeamPreviousGame(DODGERS, LAST_FULL_SEASON))!;
    const side = teamSide(previous.boxscore, DODGERS);
    expect(side).not.toBeNull();

    const lineup = startingLineup(side);
    expect(lineup.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    lineup.forEach((s) => {
      expect(s.fullName).not.toBe('');
      expect(s.ops).toMatch(/^\d?\.\d{3}$/);
    });

    const defense = startingDefense(side);
    expect(DEFENSE_POSITIONS.filter((pos) => !defense[pos])).toEqual([]);
    // Ohtani started Game 7 on the mound and at DH, under the two-way rule
    expect(defense.P?.personId).toBe(OHTANI);
    expect(defense.DH?.personId).toBe(OHTANI);
    expect(defense.P?.era).toMatch(/^\d+\.\d{2}$/);
    const fielders = (['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] as const).map((pos) => defense[pos]!);
    expect(new Set(fielders.map((f) => f.personId)).size).toBe(8);
    fielders.forEach((f) => expect(f.fieldingPct).toMatch(/^\d?\.\d{3}$/));
    // A postseason boxscore carries postseason totals, not the regular season's
    // (Ohtani hit 55 home runs in the 2025 regular season, 8 in the postseason)
    expect(lineup.find((s) => s.personId === OHTANI)?.homeRuns).toBe(8);
  });

  it('has a previous game for a club right now', async () => {
    const previous = await getTeamPreviousGame(TIGERS);
    expect(previous).not.toBeNull();
    expect(startingLineup(teamSide(previous!.boxscore, TIGERS))).toHaveLength(9);
  });
});

describe('transactions', () => {
  it('lists a player’s moves with dates and types', async () => {
    const transactions = (await getPlayerTransactions(OHTANI)).transactions ?? [];
    expect(transactions.length).toBeGreaterThan(3);
    transactions.forEach((t) => {
      expect(typeof t.id).toBe('number');
      expect(t.date ?? t.effectiveDate).toMatch(YMD);
      expect(typeof t.typeDesc).toBe('string');
    });
    // He signed with the Dodgers as a free agent in December 2023
    expect(transactions.some((t) => t.toTeam?.id === DODGERS && /free agent/i.test(t.typeDesc ?? ''))).toBe(true);

    const untranslated = [...new Set(transactions.map((t) => t.typeDesc!))].filter(
      (desc) => transactionTypeLabel({ typeDesc: desc }, 'zh') === desc
    );
    if (untranslated.length > 0) console.info('Move types without a Chinese label:', untranslated);
  });

  it('numbers moves in filing order, which same-day sorting relies on', async () => {
    const transactions = (await getPlayerTransactions(OHTANI)).transactions ?? [];
    const sorted = sortTransactions(transactions);
    // Newest first by date: ids should fall along with the dates
    const pairs = sorted.slice(1).map((t, i) => [sorted[i], t] as const);
    const datedApart = pairs.filter(([a, b]) => (a.date ?? '') !== (b.date ?? ''));
    const agreeing = datedApart.filter(([a, b]) => a.id! > b.id!);
    expect(agreeing.length / datedApart.length).toBeGreaterThanOrEqual(0.9);
  });
});

describe('leaderboards', () => {
  it.each([
    ['hitting', HITTING_LEADER_CATEGORIES],
    ['pitching', PITCHING_LEADER_CATEGORIES],
  ] as const)('returns a top five in every %s category', async (statGroup, categories) => {
    const groups = (
      await getLeaderboards({ statGroup, categories: [...categories], season: LAST_FULL_SEASON, limit: 5 })
    ).leagueLeaders;
    expect(groups.map((g) => g.leaderCategory).sort()).toEqual([...categories].sort());
    groups.forEach((g) => {
      expect(g.leaders.length).toBeGreaterThanOrEqual(5);
      g.leaders.forEach((l) => {
        expect(typeof l.rank).toBe('number');
        expect(typeof l.value).toBe('string');
        expect(typeof l.person.id).toBe('number');
      });
    });
    const top = groups[0].leaders[0];
    expect(findLeaderRanks(top.person.id, groups)[0].rank).toBe(1);
  });

  it('answers for the current season', async () => {
    const groups = (await getLeaderboards({ statGroup: 'hitting', season: getCurrentMlbSeason() })).leagueLeaders;
    expect(Array.isArray(groups)).toBe(true);
  });
});

describe('postseason bracket', () => {
  it('builds a bracket from a finished postseason', async () => {
    const [series, standings] = await Promise.all([
      getPostseasonSeries(LAST_FULL_SEASON),
      getStandings(LAST_FULL_SEASON, MLB_LEVEL.leagueIds),
    ]);
    // 12 clubs: 4 wild card series, 4 division series, 2 LCS, the World Series
    expect(series.series?.length).toBe(11);
    expect(buildPostseasonBracket(series, standings)).not.toBeNull();
  });
});
