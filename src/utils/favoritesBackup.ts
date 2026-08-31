import {
  STORAGE_KEYS,
  DEFAULT_FAVORITE_TEAMS,
  DEFAULT_FAVORITE_PLAYERS,
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_TEAM,
  DEFAULT_LANGUAGE,
  FAVORITES_UPDATED_EVENT,
} from '../constants/storage';

export interface FavoritePlayerMetaEntry {
  nameZh?: string;
  nameEn?: string;
}

export interface FavoritesBackupData {
  version: number;
  exportedAt: string;
  favoriteTeams: number[];
  favoritePlayers: number[];
  favoritePlayersMeta?: Record<number, FavoritePlayerMetaEntry>;
  theme?: string;
  teamColor?: string;
  language?: string;
}

export type RestoreErrorCode = 'invalid_json' | 'not_object' | 'no_data' | 'storage_error';

export interface RestoreResult {
  success: boolean;
  errorCode?: RestoreErrorCode;
  count?: { teams: number; players: number };
}

/** Cap imported list sizes: keeps localStorage and batch API URLs sane. */
const MAX_IMPORT_IDS = 500;

function readStoredIds(key: string): number[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readStoredMeta(): Record<number, FavoritePlayerMetaEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favPlayersMeta);
    return raw ? (sanitizeMeta(JSON.parse(raw)) ?? {}) : {};
  } catch {
    return {};
  }
}

/** Returns null when the field is absent/not an array (vs. an empty valid list). */
function sanitizeIds(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, MAX_IMPORT_IDS);
}

/**
 * Keep only numeric-keyed entries whose names are plain strings — anything
 * else written to localStorage would crash React when rendered as a child.
 */
function sanitizeMeta(value: unknown): Record<number, FavoritePlayerMetaEntry> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const clean: Record<number, FavoritePlayerMetaEntry> = {};
  Object.entries(value).forEach(([key, entry]) => {
    const id = Number(key);
    if (!Number.isInteger(id) || id <= 0) return;
    if (!entry || typeof entry !== 'object') return;
    const { nameZh, nameEn } = entry as Record<string, unknown>;
    const meta: FavoritePlayerMetaEntry = {};
    if (typeof nameZh === 'string') meta.nameZh = nameZh;
    if (typeof nameEn === 'string') meta.nameEn = nameEn;
    if (meta.nameZh || meta.nameEn) clean[id] = meta;
  });
  return clean;
}

/**
 * Generate current backup payload from localStorage
 */
export function generateBackupPayload(): FavoritesBackupData {
  let favoriteTeams = [...DEFAULT_FAVORITE_TEAMS];
  let favoritePlayers = [...DEFAULT_FAVORITE_PLAYERS];

  const storedTeams = readStoredIds(STORAGE_KEYS.favTeams);
  if (storedTeams.length > 0) favoriteTeams = storedTeams;

  const storedPlayers = readStoredIds(STORAGE_KEYS.favPlayers);
  if (storedPlayers.length > 0) favoritePlayers = storedPlayers;

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    favoriteTeams,
    favoritePlayers,
    favoritePlayersMeta: readStoredMeta(),
    theme: localStorage.getItem(STORAGE_KEYS.themeMode) || DEFAULT_THEME_MODE,
    teamColor: localStorage.getItem(STORAGE_KEYS.themeTeam) || DEFAULT_THEME_TEAM,
    language: localStorage.getItem(STORAGE_KEYS.language) || DEFAULT_LANGUAGE,
  };
}

/**
 * Trigger file download for favorites backup
 */
export function downloadBackupFile(): void {
  const payload = generateBackupPayload();
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];

  const a = document.createElement('a');
  a.href = url;
  a.download = `plateview-favorites-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate and restore favorites data from a JSON string.
 * Returns machine-readable error codes; the UI layer maps them to i18n text.
 */
export function restoreFavoritesFromJson(
  jsonStr: string,
  mode: 'merge' | 'overwrite' = 'merge'
): RestoreResult {
  let data: unknown;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return { success: false, errorCode: 'invalid_json' };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, errorCode: 'not_object' };
  }

  const record = data as Record<string, unknown>;
  const incomingTeams = sanitizeIds(record.favoriteTeams);
  const incomingPlayers = sanitizeIds(record.favoritePlayers);

  if (!incomingTeams && !incomingPlayers) {
    return { success: false, errorCode: 'no_data' };
  }

  const incomingMeta = sanitizeMeta(record.favoritePlayersMeta);
  const existingTeams = readStoredIds(STORAGE_KEYS.favTeams);
  const existingPlayers = readStoredIds(STORAGE_KEYS.favPlayers);
  const existingMeta = readStoredMeta();

  let finalTeams: number[];
  let finalPlayers: number[];
  let finalMeta: Record<number, FavoritePlayerMetaEntry>;

  if (mode === 'merge') {
    finalTeams = Array.from(new Set([...existingTeams, ...(incomingTeams ?? [])]));
    finalPlayers = Array.from(new Set([...existingPlayers, ...(incomingPlayers ?? [])]));
    finalMeta = { ...existingMeta, ...(incomingMeta ?? {}) };
  } else {
    // overwrite: only replace fields actually present in the backup,
    // so a partial backup never wipes data it does not carry
    finalTeams = incomingTeams ?? existingTeams;
    finalPlayers = incomingPlayers ?? existingPlayers;
    finalMeta = incomingMeta ?? existingMeta;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.favTeams, JSON.stringify(finalTeams));
    localStorage.setItem(STORAGE_KEYS.favPlayers, JSON.stringify(finalPlayers));
    localStorage.setItem(STORAGE_KEYS.favPlayersMeta, JSON.stringify(finalMeta));

    if (mode === 'overwrite') {
      if (record.theme === 'dark' || record.theme === 'light') {
        localStorage.setItem(STORAGE_KEYS.themeMode, record.theme);
      }
      // Team slugs are short lowercase codes like 'lad' / 'nyy'
      if (typeof record.teamColor === 'string' && /^[a-z]{2,4}$/.test(record.teamColor)) {
        localStorage.setItem(STORAGE_KEYS.themeTeam, record.teamColor);
      }
      if (record.language === 'zh' || record.language === 'en') {
        localStorage.setItem(STORAGE_KEYS.language, record.language);
      }
    }
  } catch {
    return { success: false, errorCode: 'storage_error' };
  }

  // Notify active hooks (same tab) so React state re-syncs with storage
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));

  return {
    success: true,
    count: {
      teams: finalTeams.length,
      players: finalPlayers.length,
    },
  };
}
