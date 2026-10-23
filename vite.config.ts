import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Hábitos (index.html en la raíz) no pasa por Vite: se copia tal cual al build.
function copiarHabitos(): Plugin {
  return {
    name: 'copiar-habitos',
    apply: 'build',
    closeBundle() {
      const out = resolve(__dirname, 'dist');
      mkdirSync(out, { recursive: true });
      for (const f of ['index.html', 'apple-touch-icon.png']) copyFileSync(resolve(__dirname, f), resolve(out, f));
    },
  };
}

export default defineConfig({
  root: resolve(__dirname, 'finanzas'),
  base: './',
  envDir: __dirname,
  plugins: [react(), copiarHabitos()],
  build: {
    outDir: resolve(__dirname, 'dist/finanzas'),
    emptyOutDir: true,
  },
  test: {
    root: __dirname,
    include: ['lib/**/*.test.ts'],
  },
} as any);
