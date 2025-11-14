import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Suppress "use client" warnings from dependencies
      babel: {
        plugins: [],
      },
    }),
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url &&
              !req.url.startsWith('/api/') &&
              !req.url.startsWith('/@') &&
              !req.url.includes('.')) {
            req.url = '/';
          }
          next();
        });
      },
    },
  ],
  appType: 'spa', // Enable SPA mode for proper client-side routing
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "use client" warnings from dependencies
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
          return;
        }
        warn(warning);
      },
    },
  },
  // Suppress console warnings during dev
  server: {
    port: 5169,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3069',
        changeOrigin: true,
      },
    },
  },
});
