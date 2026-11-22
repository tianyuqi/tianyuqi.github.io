import { defineConfig } from 'vite';

export default defineConfig({
  root: 'projects/homebuyer',
  base: '/homebuyer/',
  build: { outDir: '../../dist/homebuyer', emptyOutDir: true },
});
