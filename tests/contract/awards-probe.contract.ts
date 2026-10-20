import { it } from 'vitest';
import { fetchMlb } from '../../src/services/mlbApi';

// Temporary: the big league awards' ids
it('probes the awards endpoints', async () => {
  const list = await fetchMlb<any>('/awards', { sportId: 1 });
  const awards = (list.awards ?? []).filter((a: any) => Number(a.sortOrder ?? 9999) < 2000);
  console.info('MLBAWARDS\n' + awards.map((a: any) => `${a.id}|${a.name}|${a.sortOrder}|${a.sport?.id ?? ''}|${a.league?.id ?? ''}`).join('\n'));
  for (const id of ['ALMOY', 'NLMOY', 'ALCPOY', 'NLCPOY', 'ALSS', 'NLSS', 'ALRELOY', 'NLRELOY', 'ALHAA', 'NLHAA', 'ALCSMVP', 'NLCSMVP', 'MLBASGMVP']) {
    const r = await fetchMlb<any>(`/awards/${id}/recipients`, { season: 2025 }).catch((e) => ({ error: String(e) }));
    console.info('RECIP', id, (r.awards ?? []).length, JSON.stringify((r.awards ?? [])[0] ?? r).slice(0, 300));
  }
}, 60000);
