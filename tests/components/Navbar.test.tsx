import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { Navbar } from '../../src/components/common/Navbar';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('Navbar component', () => {
  it('renders brand, standings button, and theme/language controls', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Plate/i)).toBeInTheDocument();
    expect(screen.getByText('數據排行')).toBeInTheDocument();
    expect(screen.getByText('分區榜')).toBeInTheDocument();
    expect(screen.getByText('繁中')).toBeInTheDocument();
    expect(screen.getByLabelText(/Toggle theme mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText('☕ 贊助本專案')).toHaveAttribute('href', 'https://buymeacoffee.com/whoami885');
  });

  it('triggers scrollIntoView when clicking Standings button', () => {
    // Mock scrollIntoView
    const scrollMock = vi.fn();
    const targetElement = document.createElement('div');
    targetElement.id = 'standings';
    targetElement.scrollIntoView = scrollMock;
    document.body.appendChild(targetElement);

    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter initialEntries={['/']}>
            <Navbar />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    const standingsBtn = screen.getByText('分區榜');
    fireEvent.click(standingsBtn);

    expect(scrollMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    document.body.removeChild(targetElement);
  });

  it('opens the phone settings menu, and closes it on Escape and outside clicks', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </LanguageProvider>
      </QueryClientProvider>
    );

    const toggle = screen.getByRole('button', { name: '設定' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('navbar-settings')).toBeNull();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const menu = document.getElementById('navbar-settings')!;
    // The same team colour, language and light/dark controls as on larger screens
    expect(menu.querySelector('select')).not.toBeNull();
    expect(menu).toHaveTextContent('繁中');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.getElementById('navbar-settings')).toBeNull();

    fireEvent.click(toggle);
    fireEvent.mouseDown(document.body);
    expect(document.getElementById('navbar-settings')).toBeNull();
  });
});
