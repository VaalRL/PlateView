import { describe, it, expect } from 'vitest';
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
});
