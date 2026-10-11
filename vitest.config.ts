import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'node',
    // Review due dates use the device's local day; pin it so tests behave the same everywhere.
    env: { TZ: 'Europe/Berlin' },
  },
});
