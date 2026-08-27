import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { Footer } from '../../src/components/common/Footer';

describe('Footer component', () => {
  it('renders brand, official sponsor image badge, disclaimer and GitHub icon link with tooltip', () => {
    render(
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    );

    // Verify brand
    expect(screen.getAllByText(/PlateView/i).length).toBeGreaterThan(0);

    // Verify GitHub icon link
    const githubLink = screen.getByLabelText('GitHub Repository');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/VaalRL/PlateView');
    expect(githubLink).toHaveAttribute('target', '_blank');

    // Verify tooltip text
    expect(screen.getByText('GitHub 專案原始碼')).toBeInTheDocument();

    // Verify official Buy Me a Coffee image button
    const coffeeImg = screen.getByAltText('Buy Me A Coffee');
    expect(coffeeImg).toBeInTheDocument();
    expect(coffeeImg).toHaveAttribute(
      'src',
      'https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png'
    );
  });
});
