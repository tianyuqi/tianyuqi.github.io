import { defineConfig } from 'vitest/config';

// Discover games independently of any app's Vite root.
export default defineConfig({
  test: { include: ['hex-pairs/src/**/*.test.ts', 'estimathon/src/**/*.test.ts', 'homebuyer/src/**/*.test.ts', 'number-hunt/src/**/*.test.ts'] },
});
