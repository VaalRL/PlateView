import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../../src/hooks/useTheme';

describe('useTheme hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-team');
    document.documentElement.removeAttribute('data-mode');
  });

  it('initializes with dark mode and lad team by default', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('dark');
    expect(result.current.team).toBe('lad');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-team')).toBe('lad');
  });

  it('toggles mode from dark to light and updates DOM attributes', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('plateview_mode')).toBe('light');
  });

  it('changes team theme and updates data-team attribute', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTeam('nyy');
    });

    expect(result.current.team).toBe('nyy');
    expect(document.documentElement.getAttribute('data-team')).toBe('nyy');
    expect(localStorage.getItem('plateview_team')).toBe('nyy');
  });
});
