import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../../src/hooks/useTheme';

// Test the real first-visit default, not the one tests/setup.ts pins
vi.unmock('../../src/constants/storage');

describe('useTheme hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-team');
    document.documentElement.removeAttribute('data-mode');
  });

  it('initializes with light mode and lad team by default', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('light');
    expect(result.current.team).toBe('lad');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.getAttribute('data-team')).toBe('lad');
  });

  it('toggles mode from light to dark and saves the choice', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('plateview_mode')).toBe('dark');
  });

  it('restores a saved mode on the next visit', () => {
    localStorage.setItem('plateview_mode', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe('dark');
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
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
