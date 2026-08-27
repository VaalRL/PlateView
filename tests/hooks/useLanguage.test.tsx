import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLanguage, LanguageProvider } from '../../src/hooks/useLanguage';

describe('useLanguage hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('lang');
  });

  it('initializes with default Traditional Chinese (zh)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );

    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.lang).toBe('zh');
    expect(result.current.t('nav.badge')).toBe('MLB 即時數據');
    expect(document.documentElement.getAttribute('lang')).toBe('zh-TW');
  });

  it('toggles language between zh and en and interpolates parameters', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider>{children}</LanguageProvider>
    );

    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.toggleLang();
    });

    expect(result.current.lang).toBe('en');
    expect(result.current.t('nav.badge')).toBe('MLB Live Stats');
    expect(result.current.t('sb.games_count', { count: 15 })).toBe('15 Games');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    expect(localStorage.getItem('plateview_lang')).toBe('en');
  });
});
