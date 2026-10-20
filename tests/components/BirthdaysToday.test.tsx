import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BirthdaysToday } from '../../src/components/common/BirthdaysToday';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWith = (people: unknown[]) => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ people }) })));
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BirthdaysToday />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('BirthdaysToday', () => {
  const globalFetch = globalThis.fetch;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 6, 5, 12)); // July 5, 2026
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.stubGlobal('fetch', globalFetch);
    queryClient.clear();
  });

  it('lists today’s birthdays with club and the age they turn', async () => {
    renderWith([
      { id: 660271, fullName: 'Shohei Ohtani', birthDate: '1994-07-05', currentTeam: { id: 119 } },
      { id: 592450, fullName: 'Aaron Judge', birthDate: '1992-04-26', currentTeam: { id: 147 } },
    ]);
    expect(await screen.findByText('今日壽星')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /大谷翔平/ });
    expect(link).toHaveTextContent('LAD · 32 歲');
    expect(screen.queryByText(/賈吉/)).not.toBeInTheDocument();
  });

  it('shows nothing on a day without birthdays', async () => {
    const { container } = renderWith([{ id: 592450, fullName: 'Aaron Judge', birthDate: '1992-04-26' }]);
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
