import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateBackupPayload,
  restoreFavoritesFromJson,
} from '../../src/utils/favoritesBackup';

describe('favoritesBackup utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates a complete backup payload from localStorage', () => {
    localStorage.setItem('plateview_fav_teams', JSON.stringify([119, 147]));
    localStorage.setItem('plateview_fav_players', JSON.stringify([660271, 678906]));
    localStorage.setItem(
      'plateview_fav_players_meta',
      JSON.stringify({ 678906: { nameZh: '鄧愷威', nameEn: 'Kai-Wei Teng' } })
    );

    const payload = generateBackupPayload();

    expect(payload.version).toBe(1);
    expect(payload.favoriteTeams).toEqual([119, 147]);
    expect(payload.favoritePlayers).toEqual([660271, 678906]);
    expect(payload.favoritePlayersMeta?.[678906]?.nameZh).toBe('鄧愷威');
  });

  it('restores favorites in merge mode without duplicate IDs', () => {
    localStorage.setItem('plateview_fav_teams', JSON.stringify([119]));
    localStorage.setItem('plateview_fav_players', JSON.stringify([660271]));

    const backupJson = JSON.stringify({
      version: 1,
      favoriteTeams: [119, 147], // 119 exists, 147 is new
      favoritePlayers: [660271, 592450], // 660271 exists, 592450 is new
    });

    const result = restoreFavoritesFromJson(backupJson, 'merge');

    expect(result.success).toBe(true);
    expect(result.count?.teams).toBe(2);
    expect(result.count?.players).toBe(2);

    expect(JSON.parse(localStorage.getItem('plateview_fav_teams')!)).toEqual([119, 147]);
    expect(JSON.parse(localStorage.getItem('plateview_fav_players')!)).toEqual([660271, 592450]);
  });

  it('restores favorites in overwrite mode completely replacing existing data', () => {
    localStorage.setItem('plateview_fav_teams', JSON.stringify([119, 110]));
    localStorage.setItem('plateview_fav_players', JSON.stringify([660271, 694973]));

    const backupJson = JSON.stringify({
      version: 1,
      favoriteTeams: [147],
      favoritePlayers: [592450],
      theme: 'light',
    });

    const result = restoreFavoritesFromJson(backupJson, 'overwrite');

    expect(result.success).toBe(true);
    expect(JSON.parse(localStorage.getItem('plateview_fav_teams')!)).toEqual([147]);
    expect(JSON.parse(localStorage.getItem('plateview_fav_players')!)).toEqual([592450]);
    expect(localStorage.getItem('plateview_theme')).toBe('light');
  });

  it('handles corrupted or invalid JSON gracefully', () => {
    const result = restoreFavoritesFromJson('invalid-json-string');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
