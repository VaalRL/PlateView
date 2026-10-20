import { it } from 'vitest';
import { fetchMlb } from '../../src/services/mlbApi';

// Temporary: what the awards endpoints return
it('probes the awards endpoints', async () => {
  const list = await fetchMlb<any>('/awards', { sportId: 1 }).catch((e) => ({ error: String(e) }));
  const awards = list.awards ?? [];
  console.info('AWARDS count', awards.length, 'keys', Object.keys(awards[0] ?? {}));
  console.info('AWARDS ids', awards.map((a: any) => `${a.id}|${a.name}|${a.sortOrder ?? ''}`).join('\n'));
  for (const id of ['ALMVP', 'NLMVP', 'ALCY', 'NLCY', 'ALROY', 'NLROY', 'WSMVP', 'ALGG', 'MLBHOF']) {
    const r = await fetchMlb<any>(`/awards/${id}/recipients`, { season: 2025 }).catch((e) => ({ error: String(e) }));
    console.info('RECIP', id, JSON.stringify(r).slice(0, 900));
  }
  const all = await fetchMlb<any>('/awards/ALMVP/recipients', {}).catch((e) => ({ error: String(e) }));
  console.info('ALMVP all seasons', (all.awards ?? []).length, JSON.stringify((all.awards ?? []).slice(-2)).slice(0, 600));
  const hydrated = await fetchMlb<any>('/awards/ALMVP/recipients', { season: 2025, hydrate: 'player(currentTeam)' }).catch((e) => ({ error: String(e) }));
  console.info('HYDRATED', JSON.stringify(hydrated).slice(0, 700));
  const person = await fetchMlb<any>('/people/660271', { hydrate: 'awards' }).catch((e) => ({ error: String(e) }));
  console.info('PERSON AWARDS', JSON.stringify(person.people?.[0]?.awards?.slice(0, 3)).slice(0, 600), (person.people?.[0]?.awards ?? []).length);
}, 60000);
