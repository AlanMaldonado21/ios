import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Código fuente en finanzas-src/. El build compilado va a finanzas/ (se commitea:
// GitHub Pages sirve main tal cual, sin compilar). Hábitos (index.html) no pasa por Vite.

export default defineConfig({
  root: resolve(__dirname, 'finanzas-src'),
  base: './',
  envDir: __dirname,
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'finanzas'),
    chunkSizeWarningLimit: 1000,
    emptyOutDir: true,
  },
  test: {
    root: __dirname,
    include: ['lib/**/*.test.ts'],
  },
} as any);
