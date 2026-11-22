import { defineConfig } from 'vitest/config';

// Discover games independently of any app's Vite root.
export default defineConfig({
  test: { include: ['projects/*/src/**/*.test.{ts,tsx}', 'shared/**/*.test.ts'] },
});
