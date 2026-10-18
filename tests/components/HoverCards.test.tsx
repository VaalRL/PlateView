import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, act, waitForElementToBeRemoved } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamHoverCard } from '../../src/components/common/TeamHoverCard';
import { PlayerHoverCard } from '../../src/components/common/PlayerHoverCard';
import rochester from '../fixtures/team-rochester.json';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

// The cards load lazily; compile them up front so the first test's wait is
// about the card, not about the test runner transforming the module
beforeAll(async () => {
  await Promise.all([
    import('../../src/components/common/HoverCardPopup'),
    import('../../src/components/common/TeamCardContent'),
    import('../../src/components/common/PlayerCardContent'),
  ]);
});

const standings = {
  records: [
    {
      division: { id: 203, name: 'National League West' },
      league: { id: 104 },
      teamRecords: [
        { team: { id: 119, name: 'Los Angeles Dodgers' }, divisionRank: '1', wins: 93, losses: 69, winningPercentage: '.574' },
      ],
    },
  ],
};

const leaders = (statGroup: string) =>
  statGroup === 'hitting'
    ? {
        leagueLeaders: [
          { leaderCategory: 'homeRuns', statGroup, season: '2026', leaders: [{ rank: 2, value: '50', person: { id: 660271, fullName: 'Shohei Ohtani' }, team: { id: 119, name: 'Los Angeles Dodgers' } }] },
          { leaderCategory: 'hits', statGroup, season: '2026', leaders: [{ rank: 1, value: '200', person: { id: 1, fullName: 'Other' }, team: { id: 119, name: 'Los Angeles Dodgers' } }] },
        ],
      }
    : { leagueLeaders: [] };

function stubApi(people: unknown) {
  const fetchMock = vi.fn(async (url: string) => {
    const u = decodeURIComponent(url);
    const body = u.includes('/standings')
      ? standings
      : u.includes('/stats/leaders')
        ? leaders(new URL(url).searchParams.get('statGroup') ?? '')
        : u.includes('/teams/534')
          ? rochester
          : u.includes('/teams/238')
            ? { teams: [{ id: 238, name: 'Oklahoma City Comets', sport: { id: 11 }, parentOrgId: 119 }] }
          : u.includes('/people/')
            ? people
            : {};
    return { ok: true, status: 200, statusText: 'OK', json: async () => body };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const renderLink = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );

/** Keyboard focus opens the card; hover needs a real mouse pointer, which jsdom lacks */
const open = (name: string) => act(() => screen.getByRole('link', { name }).focus());

describe('hover cards', () => {
  const globalFetch = globalThis.fetch;

  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
    queryClient.clear();
  });

  it('shows a big league club’s division rank, win percentage and record', async () => {
    stubApi({});
    renderLink(
      <TeamHoverCard teamId={119}>
        <Link to="/teams/119">Dodgers</Link>
      </TeamHoverCard>
    );
    open('Dodgers');

    const card = await screen.findByRole('tooltip');
    expect(card).toHaveTextContent('洛杉磯道奇');
    expect(card).toHaveTextContent('國聯西區');
    expect(await screen.findByText('第 1')).toBeInTheDocument();
    expect(screen.getByText('.574')).toBeInTheDocument();
    expect(screen.getByText('93-69')).toBeInTheDocument();
  });

  it('shows whose system a minor league club is in', async () => {
    stubApi({});
    renderLink(
      <TeamHoverCard teamId={534} name="Rochester Red Wings">
        <Link to="/teams/534">Red Wings</Link>
      </TeamHoverCard>
    );
    open('Red Wings');

    expect(await screen.findByText('華盛頓國民 體系')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('AAA');
  });

  it('shows a player’s club and only the leaderboards he is on', async () => {
    stubApi({
      people: [
        {
          id: 660271,
          fullName: 'Shohei Ohtani',
          primaryPosition: { abbreviation: 'TWP' },
          currentTeam: { id: 119, name: 'Los Angeles Dodgers', sport: { id: 1 } },
        },
      ],
    });
    renderLink(
      <PlayerHoverCard personId={660271}>
        <Link to="/players/660271" title="Shohei Ohtani">
          Ohtani
        </Link>
      </PlayerHoverCard>
    );
    // The card stands in for the native tooltip
    expect(screen.getByRole('link', { name: 'Ohtani' })).not.toHaveAttribute('title');
    open('Ohtani');

    expect(await screen.findByText('MLB 第 2')).toBeInTheDocument();
    const card = screen.getByRole('tooltip');
    expect(card).toHaveTextContent('大谷翔平');
    expect(card).toHaveTextContent('洛杉磯道奇');
    expect(card).toHaveTextContent('全壘打');
    // A category he is not in stays off the card
    expect(card).not.toHaveTextContent('200');
  });

  it('shows a minor leaguer’s level and parent club, and no leaderboard', async () => {
    const fetchMock = stubApi({
      people: [
        {
          id: 678020,
          fullName: 'Seth Halvorsen',
          // As the live API returns it: no sport, no parentOrgName
          currentTeam: { id: 238, name: 'Oklahoma City Comets', parentOrgId: 119 },
        },
      ],
    });
    renderLink(
      <PlayerHoverCard personId={678020}>
        <Link to="/players/678020">Halvorsen</Link>
      </PlayerHoverCard>
    );
    open('Halvorsen');

    expect(await screen.findByText('洛杉磯道奇 體系')).toBeInTheDocument();
    // The level comes from the club's own record, a second request
    expect(await screen.findByText('AAA')).toBeInTheDocument();
    const card = screen.getByRole('tooltip');
    expect(card).toHaveTextContent('Oklahoma City Comets');
    expect(card).not.toHaveTextContent('排行榜');
    // The leaderboards are MLB only, so they are not asked for
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/stats/leaders'))).toBe(false);
  });

  it('loads nothing until opened and closes on Escape', async () => {
    const fetchMock = stubApi({});
    renderLink(
      <TeamHoverCard teamId={119}>
        <Link to="/teams/119">Dodgers</Link>
      </TeamHoverCard>
    );
    expect(fetchMock).not.toHaveBeenCalled();
    open('Dodgers');
    await screen.findByRole('tooltip');
    expect(fetchMock).toHaveBeenCalled();

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('hover card pointer handling', () => {
  const globalFetch = globalThis.fetch;

  // jsdom has no PointerEvent, so pointerType would be dropped
  beforeAll(() => {
    if (!('PointerEvent' in window)) {
      class PointerEventPolyfill extends MouseEvent {
        pointerType: string;
        constructor(type: string, init: PointerEventInit = {}) {
          super(type, init);
          this.pointerType = init.pointerType ?? '';
        }
      }
      vi.stubGlobal('PointerEvent', PointerEventPolyfill);
    }
  });

  afterEach(() => {
    vi.stubGlobal('fetch', globalFetch);
    queryClient.clear();
  });

  const renderTeam = () =>
    renderLink(
      <TeamHoverCard teamId={119}>
        <Link to="/teams/119">Dodgers</Link>
      </TeamHoverCard>
    );

  it('opens after a mouse rests on the link and closes when it leaves', async () => {
    stubApi({});
    renderTeam();
    const link = screen.getByRole('link', { name: 'Dodgers' });

    fireEvent.pointerEnter(link, { pointerType: 'mouse' });
    // Not at once: a mouse crossing a list should load nothing
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    const card = await screen.findByRole('tooltip');
    expect(link).toHaveAttribute('aria-describedby', card.id);

    fireEvent.pointerLeave(link, { pointerType: 'mouse' });
    await waitForElementToBeRemoved(() => screen.queryByRole('tooltip'));
  });

  it('ignores a passing mouse and touch', async () => {
    stubApi({});
    renderTeam();
    const link = screen.getByRole('link', { name: 'Dodgers' });

    fireEvent.pointerEnter(link, { pointerType: 'mouse' });
    await act(() => new Promise((r) => setTimeout(r, 100)));
    fireEvent.pointerLeave(link, { pointerType: 'mouse' });
    fireEvent.pointerEnter(link, { pointerType: 'touch' });
    await act(() => new Promise((r) => setTimeout(r, 600)));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
