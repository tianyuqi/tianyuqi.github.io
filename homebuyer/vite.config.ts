import { defineConfig } from 'vite';

export default defineConfig({
  root: 'homebuyer',
  base: '/homebuyer/',
  build: { outDir: '../dist/homebuyer', emptyOutDir: true },
});
