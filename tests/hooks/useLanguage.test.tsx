import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLanguage, LanguageProvider } from '../../src/hooks/useLanguage';

// Test the real first-visit default, not the one tests/setup.ts pins
vi.unmock('../../src/constants/storage');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('useLanguage hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
  });

  it('opens in English on a first visit', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.lang).toBe('en');
    expect(result.current.t('nav.badge')).toBe('MLB Live Stats');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('toggles language between en and zh, interpolates parameters and saves the choice', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.toggleLang();
    });

    expect(result.current.lang).toBe('zh');
    expect(result.current.t('nav.badge')).toBe('MLB 即時數據');
    expect(document.documentElement.getAttribute('lang')).toBe('zh-TW');
    expect(localStorage.getItem('plateview_lang')).toBe('zh');

    act(() => {
      result.current.toggleLang();
    });

    expect(result.current.lang).toBe('en');
    expect(result.current.t('sb.games_count', { count: 15 })).toBe('15 Games');
    expect(localStorage.getItem('plateview_lang')).toBe('en');
  });

  it('restores a saved choice on the next visit', () => {
    localStorage.setItem('plateview_lang', 'zh');
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.lang).toBe('zh');
    expect(document.documentElement.getAttribute('lang')).toBe('zh-TW');
  });

  it('still works when storage throws', () => {
    const getItem = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    try {
      const { result } = renderHook(() => useLanguage(), { wrapper });
      expect(result.current.lang).toBe('en');
      act(() => {
        result.current.toggleLang();
      });
      expect(result.current.lang).toBe('zh');
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});
