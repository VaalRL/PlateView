import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerDetailPage } from '../../src/pages/PlayerDetailPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('PlayerDetailPage component', () => {
  it('renders Shohei Ohtani profile with English primary name and Chinese secondary', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/660271']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Primary heading is always the English name
    expect(screen.getByRole('heading', { name: /Shohei Ohtani/ })).toBeInTheDocument();
    // Chinese name from the dictionary stays visible as a secondary line
    expect(screen.getByText(/大谷翔平/)).toBeInTheDocument();
    expect(screen.getByText('已收藏球星')).toBeInTheDocument();
  });

  it('renders Hao-Yu Lee profile correctly with ID 701678', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/701678']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: /Hao-Yu Lee/ })).toBeInTheDocument();
    expect(screen.getByText(/李灝宇/)).toBeInTheDocument();
    expect(screen.getByText('收藏此球星')).toBeInTheDocument();
  });

  it('renders unknown or unseeded player page gracefully', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/694380']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('收藏此球星')).toBeInTheDocument();
  });
});
