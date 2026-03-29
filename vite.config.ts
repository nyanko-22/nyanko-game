import { defineConfig } from 'vite';

export default defineConfig({
  base: '/nyanko-game/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
