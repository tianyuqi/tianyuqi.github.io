import { defineConfig } from 'vite';
export default defineConfig({
  root: 'projects/number-hunt',
  base: '/number-hunt/',
  build: { outDir: '../../dist/number-hunt', emptyOutDir: true },
});
