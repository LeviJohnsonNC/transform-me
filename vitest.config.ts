import { defineConfig } from 'vitest/config';
import path from 'path';

// Deliberately separate from vite.config.ts: that config loads `lovable-tagger`,
// which is a dev-server concern and irrelevant (and an extra failure mode) here.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Date handling is timezone-sensitive: habit dates are 'YYYY-MM-DD' strings
    // parsed as LOCAL midnight. Pinning the zone keeps runs reproducible across
    // machines and CI. Chosen to be a non-UTC zone so UTC-vs-local bugs surface.
    env: { TZ: 'America/Los_Angeles' },
  },
});
