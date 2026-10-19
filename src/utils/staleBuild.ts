/**
 * Every deploy renames the hashed code files and removes the old ones, so a
 * tab opened before a deploy fails to load any page or card it had not
 * loaded yet. Reloading picks up the new build.
 */

/** How browsers word a failed dynamic import (Chrome, Firefox, Safari) */
const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_ERROR.test(error.message);
}

const RELOADED_AT = 'plateview_stale_reload_at';
/** A second failure this soon after reloading is not a stale build; stop and show it */
const LOOP_GUARD_MS = 10_000;

/** Indirection so tests can watch the reload */
export const pageReloader = {
  reload: () => window.location.reload(),
};

/**
 * Reload once to pick up the new build. Returns false, without reloading,
 * when it already did so moments ago or cannot remember having done so
 * (storage blocked), so a page that keeps failing shows its error instead of
 * reloading forever.
 */
export function reloadForNewBuild(now: number = Date.now()): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT));
    if (last && now - last < LOOP_GUARD_MS) return false;
    sessionStorage.setItem(RELOADED_AT, String(now));
  } catch {
    return false;
  }
  pageReloader.reload();
  return true;
}
