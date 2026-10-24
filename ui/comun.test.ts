import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';

// Carga ui/comun.js (script clásico) con un entorno mínimo de navegador.
type C = Record<string, any>;
let Comun: C;
const store: Record<string, string> = {};
function cargar() {
  const g = globalThis as any;
  g.window = g;
  g.localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = String(v); }, removeItem: (k: string) => { delete store[k]; } };
  g.document = { documentElement: { classList: { toggle: () => {} } } };
  g.addEventListener = () => {};
  g.matchMedia = () => ({ matches: false });
  new Function(fs.readFileSync(new URL('./comun.js', import.meta.url), 'utf8'))();
  Comun = g.Comun;
}
const k = (d: Date) => Comun.key(d);
const dia = (n: number) => { const d = new Date(); d.setHours(12); d.setDate(d.getDate() - n); return d; };

beforeEach(() => { for (const x of Object.keys(store)) delete store[x]; vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 24, 12)); cargar(); }); // sábado 24/10/2026

describe('semana buena', () => {
  const todos = [0, 1, 2, 3, 4, 5, 6];
  const S = (log: Record<string, string[]>, extra = {}) => ({ habits: [{ id: 'a', name: 'A', days: todos, since: '2026-09-01' }], log, settings: { goal: 1, ...extra } });
  it('4 de 7 días con la meta = buena; menos y terminada = floja; un día en cero no rompe', () => {
    const log: Record<string, string[]> = {};
    // semana 12–18 oct: 4 días → buena; semana 5–11 oct: 2 días → floja
    ['2026-10-12', '2026-10-13', '2026-10-15', '2026-10-18', '2026-10-05', '2026-10-06'].forEach(x => { log[x] = ['a']; });
    const s = S(log);
    expect(Comun.semana(s, new Date(2026, 9, 12)).estado).toBe('buena');
    expect(Comun.semana(s, new Date(2026, 9, 5)).estado).toBe('floja');
    // semana en curso (19–25) sin nada: en curso, todavía posible, no corta
    const cur = Comun.semana(s, new Date(2026, 9, 19));
    expect(cur.estado).toBe('en curso');
    expect(Comun.rachaSemanas(s).actual).toBe(1);
  });
  it('el mínimo es configurable y baja si hay pocos días programados', () => {
    const s = { habits: [{ id: 'a', name: 'A', days: [1, 3], since: '2026-09-01' }], log: { '2026-10-12': ['a'], '2026-10-14': ['a'] }, settings: { goal: 1, weekMin: 4 } };
    const se = Comun.semana(s, new Date(2026, 9, 12));
    expect(se.minimo).toBe(2);
    expect(se.estado).toBe('buena');
    expect(Comun.fraseSemana(se)).toBe('2 de 2. Semana buena.');
  });
  it('no modifica los datos que recibe', () => {
    const s = S({});
    Comun.rachaSemanas(s); Comun.hitos(s);
    expect(s.settings).toEqual({ goal: 1 });
  });
});

describe('hitos (derivados del log)', () => {
  it('sesiones, hito propio y un mes sin saltearte', () => {
    const log: Record<string, string[]> = {};
    for (let n = 1; n <= 30; n++) log[k(dia(n))] = ['a'];
    const s = { habits: [{ id: 'a', name: 'Mate', days: [0, 1, 2, 3, 4, 5, 6], since: k(dia(30)), hito: 12 }], log, settings: { goal: 1 } };
    const ids = Comun.hitos(s).logrados.map((x: C) => x.id);
    expect(ids).toContain('a:s10');
    expect(ids).toContain('a:s12');
    expect(ids).toContain('a:s25');
    expect(ids).toContain('a:mes');
    expect(Comun.hitos(s).proximos[0]).toMatchObject({ meta: 50, hechas: 30 });
  });
});

describe('finanzas: registro y camino de ahorro', () => {
  it('cuenta días con carga (gasto o "no gasté"); hoy sin carga no corta', () => {
    const f = { gastos: [{ fecha: k(dia(1)) }, { fecha: k(dia(2)) }], sinGasto: [k(dia(3))] };
    expect(Comun.rachaRegistro(f)).toEqual({ dias: 3, hoy: false });
    expect(Comun.rachaRegistro({ gastos: [{ fecha: k(dia(0)) }, { fecha: k(dia(2)) }] })).toEqual({ dias: 1, hoy: true });
  });
  it('hitos de ahorro hasta la meta', () => {
    expect(Comun.caminoAhorro(15000)).toEqual([1500, 3000, 5000, 7500, 10000, 12500, 15000]);
    expect(Comun.caminoAhorro(2000)).toEqual([1500, 2000]);
    expect(Comun.caminoAhorro(0)).toEqual([]);
  });
});
