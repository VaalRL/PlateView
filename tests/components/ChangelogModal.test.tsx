import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { Footer } from '../../src/components/common/Footer';
import { CHANGELOG } from '../../src/constants/changelog';
import pkg from '../../package.json';

describe('Changelog', () => {
  it('lists the package.json version first, then strictly older versions', () => {
    expect(CHANGELOG[0].version).toBe(pkg.version);

    const toNum = (v: string) => v.split('.').reduce((acc, n) => acc * 1000 + Number(n), 0);
    for (let i = 1; i < CHANGELOG.length; i++) {
      expect(toNum(CHANGELOG[i - 1].version)).toBeGreaterThan(toNum(CHANGELOG[i].version));
      expect(CHANGELOG[i - 1].date >= CHANGELOG[i].date).toBe(true);
    }
  });

  it('has the same number of change lines in both languages', () => {
    for (const entry of CHANGELOG) {
      expect(entry.changes.zh.length).toBeGreaterThan(0);
      expect(entry.changes.en.length).toBe(entry.changes.zh.length);
    }
  });

  it('opens the release history from the footer version and closes on Escape', () => {
    render(
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(`v${pkg.version}`) }));
    const dialog = screen.getByRole('dialog');
    for (const entry of CHANGELOG) {
      expect(dialog).toHaveTextContent(`v${entry.version}`);
    }

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
