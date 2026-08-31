/**
 * Single source of truth for localStorage keys, default favorites,
 * and the cross-instance sync event name.
 * All reads/writes of these keys MUST import from this module.
 */
export const STORAGE_KEYS = {
  favTeams: 'plateview_fav_teams',
  favPlayers: 'plateview_fav_players',
  favPlayersMeta: 'plateview_fav_players_meta',
  themeMode: 'plateview_mode',
  themeTeam: 'plateview_team',
  language: 'plateview_lang',
} as const;

/** Default: Dodgers */
export const DEFAULT_FAVORITE_TEAMS: readonly number[] = [119];

/** Default: Ohtani, Skenes */
export const DEFAULT_FAVORITE_PLAYERS: readonly number[] = [660271, 694973];

export const DEFAULT_THEME_MODE = 'dark';
export const DEFAULT_THEME_TEAM = 'lad';
export const DEFAULT_LANGUAGE = 'zh';

/**
 * Dispatched after favorites/settings are persisted so other live hook
 * instances in the same tab reload from storage (the native 'storage'
 * event only fires in OTHER tabs).
 */
export const FAVORITES_UPDATED_EVENT = 'plateview_favorites_updated';
