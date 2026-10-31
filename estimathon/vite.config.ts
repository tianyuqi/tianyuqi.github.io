import { defineConfig } from 'vite';

export default defineConfig({
  root: 'estimathon',
  base: '/estimathon/',
  build: { outDir: '../dist/estimathon', emptyOutDir: true },
});
