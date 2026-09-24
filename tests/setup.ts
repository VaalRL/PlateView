import '@testing-library/jest-dom';
import { vi } from 'vitest';

// The app opens in English + light, but the component suites were written
// against the Chinese copy and the dark theme. Pin those first-visit defaults
// here so the suites keep asserting on the same text; tests of the defaults
// themselves call vi.unmock('../../src/constants/storage').
vi.mock('../src/constants/storage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/constants/storage')>()),
  DEFAULT_LANGUAGE: 'zh',
  DEFAULT_THEME_MODE: 'dark',
}));

// Stub the network: unit/component tests must never hit the real MLB API.
// Queries resolve to an empty object, which every consumer handles via
// optional chaining. Individual tests may override with vi.mocked(fetch).
vi.stubGlobal(
  'fetch',
  vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({}),
  }))
);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock LocalStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
