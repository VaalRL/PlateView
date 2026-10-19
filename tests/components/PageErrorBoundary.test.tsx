import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { PageErrorBoundary } from '../../src/components/common/PageErrorBoundary';
import { pageReloader } from '../../src/utils/staleBuild';

const Throws: React.FC<{ message: string }> = ({ message }) => {
  throw new TypeError(message);
};

const renderAt = (message: string) =>
  render(
    <MemoryRouter initialEntries={['/broken']}>
      <nav>
        <Link to="/fine">elsewhere</Link>
      </nav>
      <PageErrorBoundary>
        <Routes>
          <Route path="/broken" element={<Throws message={message} />} />
          <Route path="/fine" element={<div>FINE PAGE</div>} />
        </Routes>
      </PageErrorBoundary>
    </MemoryRouter>
  );

describe('PageErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('keeps an error to the page instead of blanking the whole app', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAt('Cannot read properties of undefined');

    expect(screen.getByRole('alert')).toHaveTextContent('這個頁面載入失敗');
    // The rest of the app is still there
    expect(screen.getByRole('link', { name: 'elsewhere' })).toBeInTheDocument();

    // Moving on clears it
    fireEvent.click(screen.getByRole('link', { name: 'elsewhere' }));
    expect(screen.getByText('FINE PAGE')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reloads to pick up a new build when a page’s code file is gone', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.spyOn(pageReloader, 'reload').mockImplementation(() => {});
    renderAt('Failed to fetch dynamically imported module: https://x/assets/PlayerDetailPage-old.js');

    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent('網站剛更新，正在載入新版本');
  });

  it('does not reload for an ordinary error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.spyOn(pageReloader, 'reload').mockImplementation(() => {});
    renderAt('Cannot read properties of undefined');
    expect(reload).not.toHaveBeenCalled();
  });
});
