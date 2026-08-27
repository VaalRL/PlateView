import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchModal } from '../../src/components/common/SearchModal';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('SearchModal component', () => {
  it('renders search input when open', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SearchModal isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(
      screen.getByPlaceholderText(/搜尋球員.*或球隊/)
    ).toBeInTheDocument();
  });

  it('searches for player in Traditional Chinese and finds Shohei Ohtani', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SearchModal isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/搜尋球員.*或球隊/);
    fireEvent.change(input, { target: { value: '大谷' } });

    expect(screen.getByText('大谷翔平')).toBeInTheDocument();
    expect(screen.getByText(/Shohei Ohtani/)).toBeInTheDocument();
  });

  it('searches for team in Traditional Chinese and finds Dodgers', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SearchModal isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/搜尋球員.*或球隊/);
    fireEvent.change(input, { target: { value: '道奇' } });

    expect(screen.getByText('洛杉磯道奇')).toBeInTheDocument();
  });
});
