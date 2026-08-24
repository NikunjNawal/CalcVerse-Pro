import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Purity tripwire §8.2: pure-compute unit tests run in bare Node — any
    // DOM/localStorage access inside compute() crashes its own test file.
    environmentMatchGlobs: [['src/domains/**/compute.test.ts', 'node']],
    include: ['packages/**/test/**/*.test.ts', 'src/**/*.test.ts', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.config.*'],
    },
  },
  resolve: {
    alias: [
      { find: '@calc-engine', replacement: path.resolve(__dirname, 'packages/calc-engine/src') },
      { find: '@theme', replacement: path.resolve(__dirname, 'packages/theme/src') },
      { find: '@ui', replacement: path.resolve(__dirname, 'packages/ui-components/src') },
      { find: '@format', replacement: path.resolve(__dirname, 'packages/format/src') },
      { find: '@quantities', replacement: path.resolve(__dirname, 'packages/quantities/src') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
});
