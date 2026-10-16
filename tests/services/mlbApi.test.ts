import { describe, it, expect, vi, afterEach } from 'vitest';
import { getFavoritePlayersGameLog, getPlayerDetail } from '../../src/services/mlbApi';

const ok = (body: unknown) => ({ ok: true, status: 200, statusText: 'OK', json: async () => body });

const person = (gameType: string, date: string) => ({
  people: [
    {
      id: 660271,
      fullName: 'Shohei Ohtani',
      stats: [
        {
          group: { displayName: 'hitting' },
          type: { displayName: 'gameLog' },
          splits: [{ date, gameType, stat: {} }],
        },
      ],
    },
  ],
});

/** Answers the postseason request (gameType=P) and the regular one differently */
function mockFetch(postseason: () => unknown) {
  const fetchMock = vi.fn(async (url: string) =>
    decodeURIComponent(url).includes('gameType=P') ? postseason() : ok(person('R', '2026-09-28'))
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const dates = (r: { people: { stats?: { splits?: { date?: string }[] }[] }[] }) =>
  r.people[0].stats?.[0].splits?.map((s) => s.date);

describe('postseason game logs', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
  });

  it('adds postseason games to the favorites game log', async () => {
    const fetchMock = mockFetch(() => ok(person('D', '2026-10-08')));
    const result = await getFavoritePlayersGameLog([660271]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(dates(result)).toEqual(['2026-09-28', '2026-10-08']);
  });

  it('adds postseason games to the player detail game log', async () => {
    mockFetch(() => ok(person('L', '2026-10-15')));
    const result = await getPlayerDetail(660271);

    expect(dates(result)).toEqual(['2026-09-28', '2026-10-15']);
  });

  it('keeps the regular season log when the postseason request fails', async () => {
    mockFetch(() => ({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) }));
    const result = await getFavoritePlayersGameLog([660271]);

    expect(dates(result)).toEqual(['2026-09-28']);
  });
});
