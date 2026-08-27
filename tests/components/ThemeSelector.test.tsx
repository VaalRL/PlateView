import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSelector } from '../../src/components/common/ThemeSelector';

describe('ThemeSelector component', () => {
  it('renders theme selector dropdown and toggle button', () => {
    render(<ThemeSelector />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByLabelText(/Toggle theme mode/i)).toBeInTheDocument();
  });

  it('changes team when selected', () => {
    render(<ThemeSelector />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'nyy' } });

    expect(document.documentElement.getAttribute('data-team')).toBe('nyy');
  });

  it('toggles mode between dark and light', () => {
    render(<ThemeSelector />);

    const toggleBtn = screen.getByLabelText(/Toggle theme mode/i);
    fireEvent.click(toggleBtn);

    expect(document.documentElement.getAttribute('data-mode')).toBe('light');
  });
});
