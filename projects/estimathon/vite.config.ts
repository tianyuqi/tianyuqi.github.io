import { defineConfig } from 'vite';

export default defineConfig({
  root: 'projects/estimathon',
  base: '/estimathon/',
  build: { outDir: '../../dist/estimathon', emptyOutDir: true },
});
