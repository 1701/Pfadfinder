import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify('test') },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'node',
    // Review due dates use the device's local day; pin it so tests behave the same everywhere.
    env: { TZ: 'Europe/Berlin' },
  },
});
