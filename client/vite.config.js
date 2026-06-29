import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir:       'dist',
    emptyOutDir:  true,
    sourcemap:    false,
  },
  server: {
    port: 5173,
    // Proxy API calls to Express in dev mode
    proxy: {
      '/api':      'http://localhost:3000',
      '/serve.js': 'http://localhost:3000',
      '/health':   'http://localhost:3000',
    },
  },
});
