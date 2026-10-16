import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getPostseasonGameLogs, withPostseasonGameLogs } from '../../src/services/mlbApi';
import { useFavoritePlayersGameLogQuery } from '../../src/services/queries';
import type { PeopleResponse } from '../../src/types/favorites';

const ok = (body: unknown) => ({ ok: true, status: 200, statusText: 'OK', json: async () => body });
const failed = () => ({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) });

const person = (gameType: string, date: string, gamePk: number): PeopleResponse => ({
  people: [
    {
      id: 660271,
      fullName: 'Shohei Ohtani',
      stats: [
        {
          group: { displayName: 'hitting' },
          type: { displayName: 'gameLog' },
          splits: [{ date, gameType, game: { gamePk }, stat: {} }],
        },
      ],
    },
  ],
});

const dates = (r: PeopleResponse | undefined) => r?.people[0].stats?.[0].splits?.map((s) => s.date);
const isPostseasonUrl = (url: unknown) => decodeURIComponent(String(url)).includes('gameType=P');

/** Answers the postseason request (gameType=P) and the regular one differently */
function mockFetch(postseason: () => unknown) {
  const fetchMock = vi.fn(async (url: string) => (isPostseasonUrl(url) ? postseason() : ok(person('R', '2026-09-28', 1))));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('getPostseasonGameLogs', () => {
  const globalFetch = globalThis.fetch;
  afterEach(() => vi.stubGlobal('fetch', globalFetch));

  it('asks for the postseason game log of every player at once', async () => {
    const fetchMock = mockFetch(() => ok({ people: [] }));
    await getPostseasonGameLogs([660271, 592450], 2026);
    const url = decodeURIComponent(String(fetchMock.mock.calls[0][0]));
    expect(url).toContain('personIds=660271,592450');
    expect(url).toContain('type=[gameLog],gameType=P,season=2026');
  });

  it('throws on a failed request, so the query can retry it', async () => {
    mockFetch(failed);
    await expect(getPostseasonGameLogs([660271])).rejects.toThrow();
  });
});

describe('withPostseasonGameLogs', () => {
  it('folds each player’s postseason games into his log', () => {
    const merged = withPostseasonGameLogs(person('R', '2026-09-28', 1), person('D', '2026-10-08', 2));
    expect(dates(merged)).toEqual(['2026-09-28', '2026-10-08']);
  });

  it('passes the regular season log through while the postseason is missing', () => {
    const logs = person('R', '2026-09-28', 1);
    expect(withPostseasonGameLogs(logs, undefined)).toBe(logs);
    expect(withPostseasonGameLogs(undefined, person('D', '2026-10-08', 2))).toBeUndefined();
  });
});

describe('useFavoritePlayersGameLogQuery', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    vi.useRealTimers();
    vi.stubGlobal('fetch', globalFetch);
  });

  const renderFavorites = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children);
    return renderHook(() => useFavoritePlayersGameLogQuery([660271]), { wrapper });
  };

  it('adds postseason games during the postseason', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-16T12:00:00'));
    mockFetch(() => ok(person('D', '2026-10-08', 2)));
    const { result } = renderFavorites();

    await waitFor(() => expect(dates(result.current.data)).toEqual(['2026-09-28', '2026-10-08']));
    expect(result.current.postseasonError).toBe(false);
  });

  it('keeps the regular season log and flags the postseason when its request fails', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-16T12:00:00'));
    mockFetch(failed);
    const { result } = renderFavorites();

    await waitFor(() => expect(result.current.postseasonError).toBe(true));
    expect(dates(result.current.data)).toEqual(['2026-09-28']);
  });

  it('sends no postseason request in mid-season, not even on refresh', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-01T12:00:00'));
    const fetchMock = mockFetch(() => ok(person('D', '2026-10-08', 2)));
    const { result } = renderFavorites();

    await waitFor(() => expect(dates(result.current.data)).toEqual(['2026-09-28']));
    await act(async () => {
      await result.current.refetch();
    });
    expect(fetchMock.mock.calls.some(([url]) => isPostseasonUrl(url))).toBe(false);
  });
});
