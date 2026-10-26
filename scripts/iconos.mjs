// Arma ui/icons.svg (sprite) con los íconos de Lucide que usa la app. Correr: npm run iconos
// Lucide: ISC License, https://lucide.dev
import fs from 'node:fs';
const dir = new URL('../node_modules/lucide-static/icons/', import.meta.url);
const USADOS = [
  // navegación y acciones
  'house', 'notebook-pen', 'calendar-range', 'ellipsis', 'plus', 'sun', 'chart-no-axes-column', 'list-checks', 'wallet',
  'settings', 'eye', 'eye-off', 'chevron-left', 'chevron-right', 'chevron-down', 'x', 'check', 'trash-2', 'calendar',
  'landmark', 'credit-card', 'receipt', 'calendar-days', 'arrow-left-right', 'banknote', 'refresh-cw', 'cloud', 'cloud-off',
  'triangle-alert', 'pencil', 'flag', 'clock', 'folder', 'award', 'download', 'upload', 'circle-check', 'milestone', 'undo-2', 'log-out', 'target', 'mic', 'list-todo',
  // categorías de gasto
  'utensils', 'shopping-cart', 'beer', 'car-taxi-front', 'bike', 'pill', 'shirt', 'package', 'tag',
];
const symbols = USADOS.map(n => {
  const svg = fs.readFileSync(new URL(`${n}.svg`, dir), 'utf8');
  const body = svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>')).replace(/\s*\n\s*/g, '').trim();
  return `<symbol id="i-${n}" viewBox="0 0 24 24">${body}</symbol>`;
});
fs.writeFileSync(new URL('../ui/icons.svg', import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg"><!-- Lucide (ISC) https://lucide.dev — generado por scripts/iconos.mjs -->\n${symbols.join('\n')}\n</svg>\n`);
console.log(`ui/icons.svg: ${USADOS.length} íconos`);
