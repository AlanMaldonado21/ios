// Gastos diarios y checklist de ahorro: lógica pura.
import type { Mes } from './types';

export type Medio = 'credito' | 'debito' | 'transferencia';
export const MEDIOS: { id: Medio; label: string; ico: string }[] = [
  { id: 'credito', label: 'Crédito', ico: '💳' },
  { id: 'debito', label: 'Débito', ico: '🏧' },
  { id: 'transferencia', label: 'Transferencia', ico: '🔁' },
];

export type GastoDiario = { id: string; fecha: string; tipo: string; monto: number; medio: Medio };

/** "1.234.567" o "1234567,50" → 1234567.5. Devuelve NaN si no es un número. */
export function parseMonto(txt: string): number {
  const t = txt.replace(/\s|\$/g, '').replace(/\./g, '').replace(',', '.');
  if (!t || !/^\d+(\.\d+)?$/.test(t)) return NaN;
  return Number(t);
}

export const mesDeFecha = (fecha: string): Mes => fecha.slice(0, 7);

export const gastosDelMes = (gastos: GastoDiario[], mes: Mes) => gastos.filter(g => mesDeFecha(g.fecha) === mes);

export const totalGastos = (gastos: GastoDiario[]) => gastos.reduce((a, g) => a + g.monto, 0);

export function totalPorMedio(gastos: GastoDiario[]): Record<Medio, number> {
  const r: Record<Medio, number> = { credito: 0, debito: 0, transferencia: 0 };
  for (const g of gastos) r[g.medio] += g.monto;
  return r;
}

export function totalPorTipo(gastos: GastoDiario[]): { tipo: string; total: number }[] {
  const m = new Map<string, number>();
  for (const g of gastos) m.set(g.tipo, (m.get(g.tipo) ?? 0) + g.monto);
  return [...m].map(([tipo, total]) => ({ tipo, total })).sort((a, b) => b.total - a.total);
}

/** Agrupa por día, del más nuevo al más viejo. */
export function agruparPorDia(gastos: GastoDiario[]): { fecha: string; total: number; items: GastoDiario[] }[] {
  const m = new Map<string, GastoDiario[]>();
  for (const g of [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha))) {
    if (!m.has(g.fecha)) m.set(g.fecha, []);
    m.get(g.fecha)!.push(g);
  }
  return [...m].map(([fecha, items]) => ({ fecha, items, total: totalGastos(items) }));
}

/** Checklist: { "2026-11": "2026-11-05" } = mes cumplido y cuándo se tachó. */
export type Checks = Record<Mes, string>;

export function resumenChecklist(meses: { mes: Mes; ahorroUsd: number }[], checks: Checks) {
  const hechos = meses.filter(m => checks[m.mes]);
  return {
    cumplidos: hechos.length,
    total: meses.length,
    usdCumplidos: hechos.reduce((a, m) => a + m.ahorroUsd, 0),
    usdTotal: meses.reduce((a, m) => a + m.ahorroUsd, 0),
  };
}
