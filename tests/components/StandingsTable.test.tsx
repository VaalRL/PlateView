import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StandingsTable } from '../../src/components/standings/StandingsTable';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('StandingsTable component', () => {
  it('renders league and wild card filter tabs', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StandingsTable />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/戰績與外卡爭霸榜/)).toBeInTheDocument();
    expect(screen.getByText('全部 (ALL)')).toBeInTheDocument();
    expect(screen.getByText('美聯 (AL)')).toBeInTheDocument();
    expect(screen.getByText('國聯 (NL)')).toBeInTheDocument();
    expect(screen.getByText(/外卡榜/)).toBeInTheDocument();
  });

  it('switches to Wild Card tab when clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StandingsTable />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const wcButton = screen.getByText(/外卡榜/);
    fireEvent.click(wcButton);
    expect(wcButton).toHaveClass('bg-team-primary');
  });

  describe('season progress column', () => {
    const globalFetch = globalThis.fetch;

    beforeEach(() => {
      queryClient.clear();
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            records: [
              {
                division: { id: 201, name: 'American League East', link: '' },
                teamRecords: [
                  {
                    team: { id: 139, name: 'Tampa Bay Rays' },
                    divisionRank: '1',
                    gamesPlayed: 157,
                    gamesBack: '-',
                    wins: 96,
                    losses: 61,
                    winningPercentage: '.611',
                  },
                ],
              },
            ],
          }),
        }))
      );
    });

    afterEach(() => {
      vi.stubGlobal('fetch', globalFetch);
    });

    it('shows games played by each team out of the 162-game season', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <StandingsTable />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(await screen.findByText('157/162')).toBeInTheDocument();
      expect(screen.getByText('場次')).toBeInTheDocument();
    });
  });
});
