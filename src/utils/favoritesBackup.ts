export interface FavoritesBackupData {
  version: number;
  exportedAt: string;
  favoriteTeams: number[];
  favoritePlayers: number[];
  favoritePlayersMeta?: Record<number, { nameZh?: string; nameEn?: string }>;
  theme?: string;
  teamColor?: string;
  language?: string;
}

const FAV_TEAMS_KEY = 'plateview_fav_teams';
const FAV_PLAYERS_KEY = 'plateview_fav_players';
const FAV_PLAYERS_META_KEY = 'plateview_fav_players_meta';
const THEME_KEY = 'plateview_theme';
const TEAM_COLOR_KEY = 'plateview_team_color';
const LANG_KEY = 'plateview_lang';

/**
 * Generate current backup payload from localStorage
 */
export function generateBackupPayload(): FavoritesBackupData {
  let favoriteTeams: number[] = [119];
  let favoritePlayers: number[] = [660271, 694973];
  let favoritePlayersMeta: Record<number, { nameZh?: string; nameEn?: string }> = {};

  try {
    const teams = localStorage.getItem(FAV_TEAMS_KEY);
    if (teams) favoriteTeams = JSON.parse(teams);
  } catch {}

  try {
    const players = localStorage.getItem(FAV_PLAYERS_KEY);
    if (players) favoritePlayers = JSON.parse(players);
  } catch {}

  try {
    const meta = localStorage.getItem(FAV_PLAYERS_META_KEY);
    if (meta) favoritePlayersMeta = JSON.parse(meta);
  } catch {}

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    favoriteTeams,
    favoritePlayers,
    favoritePlayersMeta,
    theme: localStorage.getItem(THEME_KEY) || 'dark',
    teamColor: localStorage.getItem(TEAM_COLOR_KEY) || '119',
    language: localStorage.getItem(LANG_KEY) || 'zh',
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
 * Validate and restore favorites data from JSON string
 */
export function restoreFavoritesFromJson(
  jsonStr: string,
  mode: 'merge' | 'overwrite' = 'merge'
): { success: boolean; error?: string; count?: { teams: number; players: number } } {
  try {
    const data = JSON.parse(jsonStr);

    if (!data || typeof data !== 'object') {
      return { success: false, error: '資料格式不是有效的 JSON 物件' };
    }

    if (!Array.isArray(data.favoriteTeams) && !Array.isArray(data.favoritePlayers)) {
      return { success: false, error: '找不到有效的收藏球隊或球員清單' };
    }

    const incomingTeams: number[] = Array.isArray(data.favoriteTeams)
      ? data.favoriteTeams.map(Number).filter((n: number) => !isNaN(n) && n > 0)
      : [];

    const incomingPlayers: number[] = Array.isArray(data.favoritePlayers)
      ? data.favoritePlayers.map(Number).filter((n: number) => !isNaN(n) && n > 0)
      : [];

    const incomingMeta =
      data.favoritePlayersMeta && typeof data.favoritePlayersMeta === 'object'
        ? data.favoritePlayersMeta
        : {};

    let finalTeams = incomingTeams;
    let finalPlayers = incomingPlayers;
    let finalMeta = incomingMeta;

    if (mode === 'merge') {
      let existingTeams: number[] = [];
      let existingPlayers: number[] = [];
      let existingMeta: Record<number, any> = {};

      try {
        const t = localStorage.getItem(FAV_TEAMS_KEY);
        if (t) existingTeams = JSON.parse(t);
      } catch {}

      try {
        const p = localStorage.getItem(FAV_PLAYERS_KEY);
        if (p) existingPlayers = JSON.parse(p);
      } catch {}

      try {
        const m = localStorage.getItem(FAV_PLAYERS_META_KEY);
        if (m) existingMeta = JSON.parse(m);
      } catch {}

      finalTeams = Array.from(new Set([...existingTeams, ...incomingTeams]));
      finalPlayers = Array.from(new Set([...existingPlayers, ...incomingPlayers]));
      finalMeta = { ...existingMeta, ...incomingMeta };
    }

    localStorage.setItem(FAV_TEAMS_KEY, JSON.stringify(finalTeams));
    localStorage.setItem(FAV_PLAYERS_KEY, JSON.stringify(finalPlayers));
    localStorage.setItem(FAV_PLAYERS_META_KEY, JSON.stringify(finalMeta));

    if (data.theme && mode === 'overwrite') {
      localStorage.setItem(THEME_KEY, data.theme);
    }
    if (data.teamColor && mode === 'overwrite') {
      localStorage.setItem(TEAM_COLOR_KEY, data.teamColor);
    }
    if (data.language && mode === 'overwrite') {
      localStorage.setItem(LANG_KEY, data.language);
    }

    // Dispatch storage event so active React hooks re-render
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('plateview_favorites_updated'));

    return {
      success: true,
      count: {
        teams: finalTeams.length,
        players: finalPlayers.length,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'JSON 解析失敗' };
  }
}
