// Lógica pura del plan de ahorro. Sin UI, sin base de datos.
import type { Cuota, FinData, Mes } from './types';

/* ---------- meses ---------- */
export function sumarMeses(m: Mes, n: number): Mes {
  const [y, mm] = m.split('-').map(Number);
  const t = y * 12 + (mm - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}
export function mesesEntre(desde: Mes, hasta: Mes): number {
  const [y1, m1] = desde.split('-').map(Number);
  const [y2, m2] = hasta.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}
export const numMes = (m: Mes) => Number(m.split('-')[1]);

/* ---------- cuotas ---------- */
export const ultimoPago = (c: Cuota): Mes => sumarMeses(c.primerPago, c.cuotasRestantes - 1);
export const totalQueFalta = (c: Cuota) => c.cuotaMensual * c.cuotasRestantes;
export const cuotaActiva = (c: Cuota, m: Mes) => c.cuotasRestantes > 0 && m >= c.primerPago && m <= ultimoPago(c);

/* ---------- gastos ---------- */
export const totalGastosFijos = (d: FinData) => d.gastosFijos.reduce((s, g) => s + g.montoMensual, 0);
export const totalSuscripcionesPesos = (d: FinData) => d.suscripciones.reduce((s, x) => s + x.montoUsd, 0) * d.settings.dolar;
export const gastosEstimados = (d: FinData) => totalGastosFijos(d) + totalSuscripcionesPesos(d);

/* ---------- ingresos ---------- */
export const totalFijos = (d: FinData) => d.ingresosFijos.reduce((s, i) => s + i.montoMensual, 0);
export const facturacionDe = (d: FinData, m: Mes) => d.facturacion.find(f => f.mes === m)?.monto ?? 0;
/** La comisión de la facturación de M se cobra en M+1. */
export const comisionCobrada = (d: FinData, m: Mes) => facturacionDe(d, sumarMeses(m, -1)) * d.comisionPct;
export const ingresoDelMes = (d: FinData, m: Mes) => totalFijos(d) + comisionCobrada(d, m);
export function aguinaldoDelMes(d: FinData, m: Mes) {
  const n = numMes(m);
  if (n !== 6 && n !== 12) return 0;
  return d.ingresosFijos.filter(i => i.esBaseAguinaldo).reduce((s, i) => s + i.montoMensual / 2, 0);
}

export const ahorroActualUsd = (d: FinData) =>
  d.settings.ahorroUsdActual + (d.settings.dolar ? d.settings.ahorroPesosActual / d.settings.dolar : 0);

export function mesesDelPlan(d: FinData): Mes[] {
  return Array.from({ length: d.settings.mesesPlan }, (_, i) => sumarMeses(d.settings.mesInicioPlan, i));
}

/* ---------- plan ---------- */
export type CuotaDelMes = { id: string; concepto: string; tarjeta: string; monto: number; numero: number; total: number };

export type MesCalc = {
  mes: Mes;
  fijos: number;
  /** Mes cuya facturación se cobra en este mes. */
  mesFacturado: Mes;
  facturacionBase: number;
  comision: number;
  ingreso: number;
  aguinaldo: number;
  ingresoTotal: number;
  pctAuto: number;
  pctManual: number | null;
  pct: number;
  ahorroPesos: number;
  ahorroUsd: number;
  usdAcumulados: number;
  cuotas: number;
  cuotasDetalle: CuotaDelMes[];
  gastos: number;
  libre: number;
  /** mes <= fecha de la meta */
  hastaMeta: boolean;
  esMesMeta: boolean;
};

export type Lectura = 'imposible' | 'muy exigente' | 'exigente pero posible' | 'cómodo';

export type Resumen = {
  mesesHastaMeta: number;
  ahorroActualUsd: number;
  usdFaltan: number;
  ahorroMensualUsd: number;
  ahorroMensualPesos: number;
  /** % del ingreso (hasta la meta) que hay que ahorrar. */
  pctNecesario: number;
  usdProyectados: number;
  diferencia: number;
  cumplida: boolean;
  estado: string;
  mesesLibreNegativo: number;
  lectura: Lectura;
  totalAhorroPesosHastaMeta: number;
  totalAhorroUsdHastaMeta: number;
  totalCuotasPlan: number;
  gastosEstimados: number;
};

export type Plan = { meses: MesCalc[]; resumen: Resumen };

export function lecturaDe(pct: number): Lectura {
  if (pct > 1) return 'imposible';
  if (pct > 0.75) return 'muy exigente';
  if (pct > 0.5) return 'exigente pero posible';
  return 'cómodo';
}

export function calcularPlan(d: FinData): Plan {
  const s = d.settings;
  const dolar = s.dolar || 1;
  const meses = mesesDelPlan(d);
  const gastos = gastosEstimados(d);
  const base = ahorroActualUsd(d);

  const mesesHastaMeta = meses.filter(m => m <= s.fechaMeta).length;
  const usdFaltan = Math.max(0, s.metaUsd - base);
  const ahorroMensualUsd = mesesHastaMeta ? usdFaltan / mesesHastaMeta : 0;
  const ahorroMensualPesos = ahorroMensualUsd * dolar;
  const ingresoHastaMeta = meses.filter(m => m <= s.fechaMeta)
    .reduce((acc, m) => acc + ingresoDelMes(d, m) + aguinaldoDelMes(d, m), 0);
  const pctNecesario = ingresoHastaMeta ? (ahorroMensualPesos * mesesHastaMeta) / ingresoHastaMeta : 0;

  let acum = base;
  const filas: MesCalc[] = meses.map(mes => {
    const fijos = totalFijos(d);
    const mesFacturado = sumarMeses(mes, -1);
    const facturacionBase = facturacionDe(d, mesFacturado);
    const comision = facturacionBase * d.comisionPct;
    const ingreso = fijos + comision;
    const aguinaldo = aguinaldoDelMes(d, mes);
    const ingresoTotal = ingreso + aguinaldo;
    const hastaMeta = mes <= s.fechaMeta;
    const pctAuto = hastaMeta && ingresoTotal ? ahorroMensualPesos / ingresoTotal : 0;
    const ov = d.overrides.find(o => o.mes === mes);
    const pctManual = ov && ov.porcentajeManual != null ? ov.porcentajeManual : null;
    const pct = pctManual ?? pctAuto;
    const ahorroPesos = ingresoTotal * pct;
    const ahorroUsd = ahorroPesos / dolar;
    acum += ahorroUsd;
    const cuotasDetalle = d.cuotas.filter(c => cuotaActiva(c, mes)).map(c => ({
      id: c.id, concepto: c.concepto, tarjeta: c.tarjeta, monto: c.cuotaMensual,
      numero: mesesEntre(c.primerPago, mes) + 1, total: c.cuotasRestantes,
    }));
    const cuotas = cuotasDetalle.reduce((a, c) => a + c.monto, 0);
    return {
      mes, fijos, mesFacturado, facturacionBase, comision, ingreso, aguinaldo, ingresoTotal,
      pctAuto, pctManual, pct, ahorroPesos, ahorroUsd, usdAcumulados: acum,
      cuotas, cuotasDetalle, gastos, libre: ingresoTotal - ahorroPesos - cuotas - gastos,
      hastaMeta, esMesMeta: mes === s.fechaMeta,
    };
  });

  const hasta = filas.filter(f => f.hastaMeta);
  const totalAhorroPesosHastaMeta = hasta.reduce((a, f) => a + f.ahorroPesos, 0);
  const totalAhorroUsdHastaMeta = hasta.reduce((a, f) => a + f.ahorroUsd, 0);
  const usdProyectados = base + totalAhorroUsdHastaMeta;
  const diferencia = usdProyectados - s.metaUsd;
  const cumplida = diferencia >= 0;

  return {
    meses: filas,
    resumen: {
      mesesHastaMeta, ahorroActualUsd: base, usdFaltan, ahorroMensualUsd, ahorroMensualPesos, pctNecesario,
      usdProyectados, diferencia, cumplida,
      estado: cumplida ? 'META CUMPLIDA' : `TE FALTAN USD ${Math.ceil(-diferencia)}`,
      mesesLibreNegativo: filas.filter(f => f.libre < 0).length,
      lectura: lecturaDe(pctNecesario),
      totalAhorroPesosHastaMeta, totalAhorroUsdHastaMeta,
      totalCuotasPlan: d.cuotas.reduce((a, c) => a + totalQueFalta(c), 0),
      gastosEstimados: gastos,
    },
  };
}

/** Mes a mostrar como "actual": el de hoy si está en el plan; si no, el primero (o el último si ya terminó). */
export function mesActualDelPlan(meses: Mes[], hoy: Mes): Mes {
  if (meses.includes(hoy)) return hoy;
  return hoy < meses[0] ? meses[0] : meses[meses.length - 1];
}
