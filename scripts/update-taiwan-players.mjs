#!/usr/bin/env node
/**
 * Rebuild src/data/taiwan-players.json: every player born in Taiwan on an
 * MLB or minor league roster this season, with his club, level and birth date.
 *
 * Run by .github/workflows/update-player-data.yml (the development machine
 * may not reach statsapi.mlb.com). Usage:
 *   node scripts/update-taiwan-players.mjs [season]
 *
 * Writes the file only when the API answered in full, and prints which of
 * the players have no Chinese name in src/data/players-zh-tw.json yet.
 */
import { readFile, writeFile, appendFile } from 'node:fs/promises';

const API = 'https://statsapi.mlb.com/api/v1';
const OUT = new URL('../src/data/taiwan-players.json', import.meta.url);
const DICTIONARY = new URL('../src/data/players-zh-tw.json', import.meta.url);

/** MLB, AAA, AA, A+, A, Rookie */
const LEVELS = [
  { sportId: 1, abbreviation: 'MLB' },
  { sportId: 11, abbreviation: 'AAA' },
  { sportId: 12, abbreviation: 'AA' },
  { sportId: 13, abbreviation: 'A+' },
  { sportId: 14, abbreviation: 'A' },
  { sportId: 16, abbreviation: 'ROK' },
];
const TAIWAN = new Set(['Taiwan', 'Chinese Taipei', 'Republic of China']);

/** Same rule as src/utils/season.ts: January and February belong to last season */
function currentSeason(now = new Date()) {
  return now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
}

async function get(path, params) {
  const url = new URL(API + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

const season = Number(process.argv[2]) || currentSeason();
const players = new Map();
const teams = new Map();

for (const { sportId, abbreviation } of LEVELS) {
  const [roster, clubs] = await Promise.all([
    get(`/sports/${sportId}/players`, {
      season,
      fields: 'people,id,fullName,birthDate,birthCountry,birthCity,primaryPosition,abbreviation,currentTeam,id',
    }),
    get('/teams', { sportId, season, fields: 'teams,id,name,parentOrgId' }),
  ]);
  const people = roster.people ?? [];
  // A level with no players means the API did not answer properly; better no update than a wrong one
  if (people.length === 0) throw new Error(`No players returned for ${abbreviation} in ${season}`);
  (clubs.teams ?? []).forEach((t) => teams.set(t.id, { ...t, sportId, level: abbreviation }));
  people
    .filter((p) => TAIWAN.has(p.birthCountry))
    .forEach((p) => {
      if (!players.has(p.id)) players.set(p.id, p);
    });
  console.log(`${abbreviation}: ${people.length} players, ${clubs.teams?.length ?? 0} clubs`);
}

const levelOrder = new Map(LEVELS.map((l, i) => [l.abbreviation, i]));
const list = [...players.values()]
  .map((p) => {
    const club = teams.get(p.currentTeam?.id);
    return {
      id: p.id,
      fullName: p.fullName,
      birthDate: p.birthDate ?? null,
      birthCity: p.birthCity ?? null,
      position: p.primaryPosition?.abbreviation ?? null,
      teamId: club?.id ?? p.currentTeam?.id ?? null,
      teamName: club?.name ?? null,
      level: club?.level ?? null,
      parentOrgId: club?.sportId === 1 ? club.id : club?.parentOrgId ?? null,
    };
  })
  .sort(
    (a, b) =>
      (levelOrder.get(a.level) ?? 99) - (levelOrder.get(b.level) ?? 99) || a.fullName.localeCompare(b.fullName)
  );

await writeFile(OUT, JSON.stringify({ season, players: list }, null, 2) + '\n');
console.log(`\nWrote ${list.length} players born in Taiwan (${season}) to src/data/taiwan-players.json`);

const named = new Set(JSON.parse(await readFile(DICTIONARY, 'utf8')).map((p) => p.id));
const missing = list.filter((p) => !named.has(p.id));
const report = [
  `### Players born in Taiwan, ${season}: ${list.length}`,
  '',
  `${missing.length} have no Chinese name in src/data/players-zh-tw.json:`,
  '',
  ...missing.map((p) => `- ${p.fullName} (${p.id}) — ${p.level ?? '?'} ${p.teamName ?? ''}`),
].join('\n');
console.log('\n' + report);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report + '\n');
// The workflow reuses the report as the pull request description
if (process.env.REPORT_FILE) await writeFile(process.env.REPORT_FILE, report + '\n');
