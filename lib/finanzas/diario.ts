// Gastos diarios y checklist de ahorro: lógica pura.
import type { Cuota, Mes } from './types';
import { sumarMeses } from './calc';

export type Medio = 'credito' | 'debito' | 'transferencia';
export const MEDIOS: { id: Medio; label: string; ico: string }[] = [
  { id: 'credito', label: 'Crédito', ico: '💳' },
  { id: 'debito', label: 'Débito', ico: '🏧' },
  { id: 'transferencia', label: 'Transferencia', ico: '🔁' },
];

export type Tarjeta = 'BNA Visa' | 'MercadoPago';
export const TARJETAS: { id: Tarjeta; label: string; corto: string }[] = [
  { id: 'BNA Visa', label: 'Banco Nación', corto: 'BNA' },
  { id: 'MercadoPago', label: 'MercadoPago', corto: 'MP' },
];
/** Día de cierre del resumen BNA: lo comprado hasta ese día se paga el mes siguiente. */
export const CIERRE_BNA = 22;

export type GastoDiario = {
  id: string; fecha: string; tipo: string; monto: number; medio: Medio;
  /** Solo crédito */
  tarjeta?: Tarjeta;
  cuotas?: number;
};

/** Mes en que se paga la primera cuota de una compra con crédito. */
export function primerPagoCredito(fecha: string, tarjeta: Tarjeta): Mes {
  const mes = fecha.slice(0, 7);
  const dia = Number(fecha.slice(8, 10));
  if (tarjeta === 'BNA Visa' && dia > CIERRE_BNA) return sumarMeses(mes, 2);
  return sumarMeses(mes, 1);
}

/** Una compra con crédito se convierte en cuota del plan (aunque sea en 1 pago). */
export function cuotaDesdeGasto(g: GastoDiario): Cuota | null {
  if (g.medio !== 'credito' || !g.tarjeta) return null;
  const n = Math.max(1, Math.round(g.cuotas ?? 1));
  return {
    id: `g-${g.id}`, origen: g.id, concepto: g.tipo, tarjeta: g.tarjeta,
    cuotaMensual: g.monto / n, cuotasRestantes: n, primerPago: primerPagoCredito(g.fecha, g.tarjeta),
  };
}

/** Lo que sale del bolsillo ese mes (débito y transferencia). El crédito se paga después, como cuota. */
export const gastosAlContado = (gastos: GastoDiario[]) => gastos.filter(g => g.medio !== 'credito');

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

/**
 * Checklist: mes tachado → cuándo y cuántos USD se separaron (congelados al tachar).
 * Formato viejo: solo la fecha (string); ahí se toma el USD del plan.
 */
export type Check = string | { fecha: string; usd: number };
export type Checks = Record<Mes, Check>;

export const fechaCheck = (c: Check) => (typeof c === 'string' ? c : c.fecha);
export const usdCheck = (c: Check, plan: number) => (typeof c === 'string' ? plan : c.usd);

export function resumenChecklist(meses: { mes: Mes; ahorroUsd: number }[], checks: Checks) {
  const hechos = meses.filter(m => checks[m.mes]);
  return {
    cumplidos: hechos.length,
    total: meses.length,
    usdCumplidos: hechos.reduce((a, m) => a + usdCheck(checks[m.mes], m.ahorroUsd), 0),
    usdTotal: meses.reduce((a, m) => a + m.ahorroUsd, 0),
  };
}

/**
 * Ahorro real hasta el cierre de un mes: lo que ya tenías + los meses tachados (hasta ese mes inclusive).
 * pendiente = USD de los meses sin tachar hasta ese mes (lo que falta separar para llegar a lo proyectado).
 */
export function ahorroReal(base: number, meses: { mes: Mes; ahorroUsd: number }[], checks: Checks, hasta?: Mes) {
  let real = base, pendiente = 0;
  for (const m of meses) {
    if (hasta && m.mes > hasta) break;
    if (checks[m.mes]) real += usdCheck(checks[m.mes], m.ahorroUsd); else pendiente += m.ahorroUsd;
  }
  return { real, pendiente };
}

export type Ritmo = {
  dia: number; diasMes: number; diasRestantes: number;
  gastado: number; hoy: number;
  /** Con tope: lo que queda, lo que podés gastar por día desde hoy y dónde "debería" ir según el día. */
  tope: number | null; quedan: number | null; porDia: number | null; ideal: number | null;
  /** Sin tope (o con): a este ritmo cerrás el mes en... */
  proyeccion: number; promedioDia: number;
  nivel: 'pos' | 'warn' | 'neg';
};

/** ¿Cómo va el mes? Solo mira lo que sale del bolsillo (débito/transferencia) del mes de `hoy` (YYYY-MM-DD). */
export function ritmoMes(gastos: GastoDiario[], tope: number | null, hoy: string): Ritmo {
  const mes = mesDeFecha(hoy);
  const [y, m, d] = hoy.split('-').map(Number);
  const diasMes = new Date(y, m, 0).getDate();
  const delMes = gastosAlContado(gastosDelMes(gastos, mes));
  const gastado = totalGastos(delMes);
  const hoyTotal = totalGastos(delMes.filter(g => g.fecha === hoy));
  const diasRestantes = diasMes - d + 1; // contando hoy
  const promedioDia = gastado / d;
  const proyeccion = promedioDia * diasMes;
  const t = tope && tope > 0 ? tope : null;
  const ideal = t ? (t * d) / diasMes : null;
  const quedan = t ? t - gastado : null;
  const porDia = t && quedan! > 0 ? quedan! / diasRestantes : t ? 0 : null;
  const nivel = !t ? 'pos' : gastado > t ? 'neg' : gastado > ideal! * 1.05 ? 'warn' : 'pos';
  return { dia: d, diasMes, diasRestantes, gastado, hoy: hoyTotal, tope: t, quedan, porDia, ideal, proyeccion, promedioDia, nivel };
}
