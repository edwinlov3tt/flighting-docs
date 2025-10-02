import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'templates/*',
          dest: 'templates'
        }
      ]
    })
  ],
  server: {
    port: 8000
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
