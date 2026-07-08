import { defineConfig } from 'vitest/config';

// Standalone test config (no Vite plugins) so unit tests run fast and isolated
// from the PWA/React build pipeline. Tests live next to source as *.test.js.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
