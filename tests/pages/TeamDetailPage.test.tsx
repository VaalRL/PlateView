import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamDetailPage } from '../../src/pages/TeamDetailPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('TeamDetailPage component', () => {
  it('renders team header, schedule tab, and switches to roster tab', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/teams/119']}>
          <Routes>
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('洛杉磯道奇')).toBeInTheDocument();
    expect(screen.getByText('LAD')).toBeInTheDocument();
    expect(screen.getByText(/國聯西區/)).toBeInTheDocument();
    expect(screen.getByText(/收藏球隊/)).toBeInTheDocument();

    // Verify recent games tab button is present
    expect(screen.getByText(/近期戰績與逐場賽事/)).toBeInTheDocument();
    expect(screen.getByText(/陣容名單/)).toBeInTheDocument();

    // Switch to roster tab
    fireEvent.click(screen.getByText(/陣容名單/));
    expect(screen.getByText(/26 人現役名單/)).toBeInTheDocument();
  });
});
