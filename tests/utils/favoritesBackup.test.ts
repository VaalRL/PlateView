import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateBackupPayload,
  restoreFavoritesFromJson,
} from '../../src/utils/favoritesBackup';
import { STORAGE_KEYS } from '../../src/constants/storage';

describe('favoritesBackup utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates a complete backup payload from localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.favTeams, JSON.stringify([119, 147]));
    localStorage.setItem(STORAGE_KEYS.favPlayers, JSON.stringify([660271, 678906]));
    localStorage.setItem(
      STORAGE_KEYS.favPlayersMeta,
      JSON.stringify({ 678906: { nameZh: '鄧愷威', nameEn: 'Kai-Wei Teng' } })
    );

    const payload = generateBackupPayload();

    expect(payload.version).toBe(2);
    expect(payload.favoriteTeams).toEqual([119, 147]);
    expect(payload.favoritePlayers).toEqual([660271, 678906]);
    expect(payload.favoritePlayersMeta?.[678906]?.nameZh).toBe('鄧愷威');
  });

  it('exports theme/team/language from the SAME keys useTheme/useLanguage actually use', () => {
    // These are the real keys written by useTheme.ts and useLanguage.tsx
    localStorage.setItem('plateview_mode', 'light');
    localStorage.setItem('plateview_team', 'nyy');
    localStorage.setItem('plateview_lang', 'en');

    const payload = generateBackupPayload();

    expect(payload.theme).toBe('light');
    expect(payload.teamColor).toBe('nyy');
    expect(payload.language).toBe('en');
  });

  it('restores favorites in merge mode without duplicate IDs', () => {
    localStorage.setItem(STORAGE_KEYS.favTeams, JSON.stringify([119]));
    localStorage.setItem(STORAGE_KEYS.favPlayers, JSON.stringify([660271]));

    const backupJson = JSON.stringify({
      version: 2,
      favoriteTeams: [119, 147], // 119 exists, 147 is new
      favoritePlayers: [660271, 592450], // 660271 exists, 592450 is new
    });

    const result = restoreFavoritesFromJson(backupJson, 'merge');

    expect(result.success).toBe(true);
    expect(result.count?.teams).toBe(2);
    expect(result.count?.players).toBe(2);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.favTeams)!)).toEqual([119, 147]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.favPlayers)!)).toEqual([660271, 592450]);
  });

  it('restores favorites in overwrite mode completely replacing existing data', () => {
    localStorage.setItem(STORAGE_KEYS.favTeams, JSON.stringify([119, 110]));
    localStorage.setItem(STORAGE_KEYS.favPlayers, JSON.stringify([660271, 694973]));

    const backupJson = JSON.stringify({
      version: 2,
      favoriteTeams: [147],
      favoritePlayers: [592450],
      theme: 'light',
      teamColor: 'nyy',
      language: 'en',
    });

    const result = restoreFavoritesFromJson(backupJson, 'overwrite');

    expect(result.success).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.favTeams)!)).toEqual([147]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.favPlayers)!)).toEqual([592450]);
    // Theme/team/language must land on the keys useTheme/useLanguage read
    expect(localStorage.getItem('plateview_mode')).toBe('light');
    expect(localStorage.getItem('plateview_team')).toBe('nyy');
    expect(localStorage.getItem('plateview_lang')).toBe('en');
  });

  it('overwrite mode keeps fields that are absent from the backup', () => {
    localStorage.setItem(STORAGE_KEYS.favPlayers, JSON.stringify([660271]));

    const backupJson = JSON.stringify({
      version: 2,
      favoriteTeams: [147], // backup contains teams only
    });

    const result = restoreFavoritesFromJson(backupJson, 'overwrite');

    expect(result.success).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.favTeams)!)).toEqual([147]);
    // players untouched — a partial backup must not wipe them
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.favPlayers)!)).toEqual([660271]);
  });

  it('rejects invalid theme/teamColor/language values instead of persisting garbage', () => {
    const backupJson = JSON.stringify({
      version: 2,
      favoriteTeams: [147],
      theme: 'neon-rainbow',
      teamColor: '119', // legacy/invalid value domain — real values are slugs like 'lad'
      language: 'fr',
    });

    restoreFavoritesFromJson(backupJson, 'overwrite');

    expect(localStorage.getItem('plateview_mode')).toBeNull();
    expect(localStorage.getItem('plateview_team')).toBeNull();
    expect(localStorage.getItem('plateview_lang')).toBeNull();
  });

  it('filters non-string meta values so a corrupted backup cannot crash rendering', () => {
    const backupJson = JSON.stringify({
      version: 2,
      favoritePlayers: [678906],
      favoritePlayersMeta: {
        678906: { nameZh: { evil: 'object' }, nameEn: 'Kai-Wei Teng' },
        'not-a-number': { nameZh: '無效鍵' },
        999: 'not-an-object',
      },
    });

    const result = restoreFavoritesFromJson(backupJson, 'overwrite');
    expect(result.success).toBe(true);

    const meta = JSON.parse(localStorage.getItem(STORAGE_KEYS.favPlayersMeta)!);
    expect(meta[678906]).toEqual({ nameEn: 'Kai-Wei Teng' }); // object nameZh dropped
    expect(meta['not-a-number']).toBeUndefined();
    expect(meta[999]).toBeUndefined();
  });

  it('caps oversized imported ID lists', () => {
    const hugeList = Array.from({ length: 600 }, (_, i) => i + 1);
    const backupJson = JSON.stringify({ version: 2, favoritePlayers: hugeList });

    const result = restoreFavoritesFromJson(backupJson, 'overwrite');

    expect(result.success).toBe(true);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.favPlayers)!);
    expect(stored.length).toBe(500);
  });

  it('returns error codes (not hardcoded messages) for invalid input', () => {
    expect(restoreFavoritesFromJson('invalid-json-string').errorCode).toBe('invalid_json');
    expect(restoreFavoritesFromJson('"just a string"').errorCode).toBe('not_object');
    expect(restoreFavoritesFromJson('{"version":2}').errorCode).toBe('no_data');

    const failed = restoreFavoritesFromJson('invalid-json-string');
    expect(failed.success).toBe(false);
  });
});
