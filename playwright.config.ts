import { defineConfig } from '@playwright/test';

/**
 * Browser smoke tests (e2e/*.e2e.ts) against the production build served by
 * `vite preview`; the MLB API is mocked in e2e/mockApi.ts. Run after
 * `npm run build`. CHROMIUM_PATH points at a browser already on the machine
 * instead of the one `npx playwright install` downloads.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4173/',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
  },
});
