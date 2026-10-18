import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

/**
 * Contract tests: the app's own request functions against the live MLB Stats
 * API, so a change in what the API returns shows up before users see it.
 * Network-bound, so kept out of `npm test`; run with `npm run test:contract`
 * (CI runs them daily, see .github/workflows/api-contract.yml).
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['tests/contract/**/*.contract.ts'],
      environment: 'node',
      // No setup file: tests/setup.ts stubs fetch, and these need the real one
      testTimeout: 30_000,
      // One retry for a dropped connection; a second failure is the API
      retry: 1,
    },
  })
);
