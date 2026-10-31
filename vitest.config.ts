import { defineConfig } from 'vitest/config';

// Discover both games independently of either app's Vite root.
export default defineConfig({
  test: { include: ['hex-pairs/src/**/*.test.ts', 'estimathon/src/**/*.test.ts'] },
});
