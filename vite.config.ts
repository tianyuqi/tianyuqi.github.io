import { defineConfig } from 'vite';

export default defineConfig({
  root: 'hex-pairs',
  base: '/hex-pairs/',
  build: { outDir: '../dist/hex-pairs', emptyOutDir: true },
});
