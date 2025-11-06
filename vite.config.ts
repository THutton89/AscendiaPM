import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    react({
      // Suppress "use client" warnings from dependencies
      babel: {
        plugins: [],
      },
    }),
    electron({
      main: {
        entry: 'electron/main.js',
        vite: {
          build: {
            rollupOptions: {
              external: ['sql.js'],
              plugins: [
                {
                  name: 'copy-electron-files',
                  writeBundle() {
                    const electronDir = path.resolve(__dirname, 'electron');
                    const destDir = path.resolve(__dirname, 'dist', 'electron-main');
                    if (!fs.existsSync(destDir)) {
                      fs.mkdirSync(destDir, { recursive: true });
                    }
                    const files = fs.readdirSync(electronDir);
                    files.forEach((file: string) => {
                      if (file !== 'main.js') {
                        const src = path.join(electronDir, file);
                        const dest = path.join(destDir, file);
                        if (fs.statSync(src).isDirectory()) {
                          // recursive copy
                          function copyDir(src: string, dest: string) {
                            if (!fs.existsSync(dest)) {
                              fs.mkdirSync(dest, { recursive: true });
                            }
                            const files = fs.readdirSync(src);
                            files.forEach((file: string) => {
                              const srcFile = path.join(src, file);
                              const destFile = path.join(dest, file);
                              if (fs.statSync(srcFile).isDirectory()) {
                                copyDir(srcFile, destFile);
                              } else {
                                fs.copyFileSync(srcFile, destFile);
                              }
                            });
                          }
                          copyDir(src, dest);
                        } else {
                          fs.copyFileSync(src, dest);
                        }
                      }
                    });
                  }
                },
                {
                  name: 'copy-wasm-file',
                  writeBundle() {
                    const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
                    const destPath = path.resolve(__dirname, 'dist-electron', 'sql-wasm.wasm');
                    if (!fs.existsSync(path.dirname(destPath))) {
                      fs.mkdirSync(path.dirname(destPath), { recursive: true });
                    }
                    fs.copyFileSync(wasmPath, destPath);
                  }
                }
              ]
            }
          }
        }
      },
      preload: {
        input: 'electron/preload.js',
      },
    }),
    renderer(),
  ],
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
