import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerDetailPage } from '../../src/pages/PlayerDetailPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('PlayerDetailPage component', () => {
  it('renders Shohei Ohtani profile with Chinese localized metadata', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/players/660271']}>
          <Routes>
            <Route path="/players/:personId" element={<PlayerDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('大谷翔平')).toBeInTheDocument();
    expect(screen.getByText(/Shohei Ohtani/)).toBeInTheDocument();
    expect(screen.getByText(/收藏球星/)).toBeInTheDocument();
  });
});
