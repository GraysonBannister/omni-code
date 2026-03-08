import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'node:path';

// Vite configuration for Electron renderer process
export default defineConfig({
  plugins: [react()],
  
  root: path.join(__dirname, 'renderer'),
  
  base: './',
  
  build: {
    outDir: path.join(__dirname, 'dist-electron/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.join(__dirname, 'renderer/index.html'),
      },
    },
  },
  
  server: {
    port: 5173,
    strictPort: true,
  },
  
  resolve: {
    alias: {
      '@': path.join(__dirname, 'renderer'),
      '@main': path.join(__dirname, 'main'),
      '@src': path.join(__dirname, 'src'),
    },
  },
  
  css: {
    devSourcemap: true,
  },
  
  // Handle Monaco Editor worker files
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  
  esbuild: {
    target: 'es2022',
  },
});
