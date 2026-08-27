import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { LanguageSelector } from '../../src/components/common/LanguageSelector';

describe('LanguageSelector component', () => {
  it('renders language toggle button and switches between 繁中 and EN', () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
      </LanguageProvider>
    );

    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('繁中');

    fireEvent.click(btn);
    expect(btn).toHaveTextContent('EN');

    fireEvent.click(btn);
    expect(btn).toHaveTextContent('繁中');
  });
});
