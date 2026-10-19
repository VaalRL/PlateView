#!/usr/bin/env node
/**
 * Rebuild src/data/venues.json: the home ballpark of each of the 30 big
 * league clubs with its published fence distances (`fieldInfo`), which the
 * game page's alignment chart draws the outfield from. The page asks the
 * API only for parks not in the file (a game in London or Tokyo).
 *
 * Run by .github/workflows/update-player-data.yml (the development machine
 * may not reach statsapi.mlb.com). Usage:
 *   node scripts/update-venues.mjs [season]
 *
 * Writes the file only when every club's park came back with its distances.
 */
import { readFile, writeFile, appendFile } from 'node:fs/promises';

const API = 'https://statsapi.mlb.com/api/v1';
const OUT = new URL('../src/data/venues.json', import.meta.url);
const FENCE_KEYS = ['leftLine', 'left', 'leftCenter', 'center', 'rightCenter', 'right', 'rightLine'];

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

const { teams = [] } = await get('/teams', { sportId: 1, season, fields: 'teams,id,venue,id' });
const venueIds = [...new Set(teams.map((t) => t.venue?.id).filter(Boolean))];
// A club shares a park only for a season or two (the Athletics with the Rays
// in 2025), so far fewer than 28 means the API did not answer properly
if (teams.length !== 30 || venueIds.length < 28) {
  throw new Error(`Expected 30 clubs and their parks for ${season}, got ${teams.length} clubs and ${venueIds.length} parks`);
}

const { venues = [] } = await get('/venues', {
  venueIds: venueIds.join(','),
  hydrate: 'fieldInfo',
  fields: `venues,id,name,fieldInfo,turfType,roofType,capacity,${FENCE_KEYS.join(',')}`,
});

const list = venues
  .map((v) => ({
    id: v.id,
    name: v.name,
    fieldInfo: Object.fromEntries(
      ['capacity', 'turfType', 'roofType', ...FENCE_KEYS]
        .filter((k) => v.fieldInfo?.[k] !== undefined)
        .map((k) => [k, v.fieldInfo[k]])
    ),
  }))
  .sort((a, b) => a.id - b.id);

const incomplete = list.filter((v) => typeof v.fieldInfo.center !== 'number');
if (list.length !== venueIds.length || incomplete.length > 0) {
  throw new Error(
    `Parks without fence distances: ${incomplete.map((v) => v.name).join(', ') || 'none'}; ` +
      `${list.length} of ${venueIds.length} returned`
  );
}

const before = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => ({ venues: [] }));
const known = new Map(before.venues.map((v) => [v.id, JSON.stringify(v)]));
const changed = list.filter((v) => known.get(v.id) !== JSON.stringify(v)).map((v) => v.name);

await writeFile(OUT, JSON.stringify({ season, venues: list }, null, 2) + '\n');
const report = [
  '',
  `### Big league ballparks, ${season}: ${list.length}`,
  '',
  changed.length > 0 ? `New or changed: ${changed.join(', ')}` : 'No park changed.',
].join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report + '\n');
// Added to the pull request description the player list starts
if (process.env.REPORT_FILE) await appendFile(process.env.REPORT_FILE, report + '\n');
