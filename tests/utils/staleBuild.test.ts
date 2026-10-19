import { describe, it, expect, vi, afterEach } from 'vitest';
import { isChunkLoadError, pageReloader, reloadForNewBuild } from '../../src/utils/staleBuild';

describe('isChunkLoadError', () => {
  it('recognises a failed dynamic import in each browser’s wording', () => {
    [
      'Failed to fetch dynamically imported module: https://x/assets/PlayerDetailPage-abc.js', // Chrome
      'error loading dynamically imported module: https://x/assets/a.js', // Firefox
      'Importing a module script failed.', // Safari
    ].forEach((message) => expect(isChunkLoadError(new TypeError(message))).toBe(true));
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false);
  });
});

describe('reloadForNewBuild', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('reloads once, then not again moments later', () => {
    const reload = vi.spyOn(pageReloader, 'reload').mockImplementation(() => {});
    expect(reloadForNewBuild(1_000_000)).toBe(true);
    expect(reloadForNewBuild(1_005_000)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    // Long after, a new deploy can reload again
    expect(reloadForNewBuild(1_100_000)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('does not reload when it cannot remember doing so', () => {
    const reload = vi.spyOn(pageReloader, 'reload').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(reloadForNewBuild()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
