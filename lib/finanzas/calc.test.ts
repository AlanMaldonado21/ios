import { describe, expect, it } from 'vitest';
import {
  ahorroActualUsd, calcularPlan, cuotaActiva, gastosEstimados, ingresoDelMes, lecturaDe, mesActualDelPlan,
  sumarMeses, totalQueFalta, ultimoPago,
} from './calc';
import { SEED } from './seed';
import { fmtArs, fmtUsd } from './format';

const plan = calcularPlan(SEED);
const mes = (m: string) => plan.meses.find(x => x.mes === m)!;

describe('números de la planilla', () => {
  it('ingresos de nov, dic y ene', () => {
    expect(ingresoDelMes(SEED, '2026-11')).toBe(3725000);
    expect(ingresoDelMes(SEED, '2026-12')).toBe(3885000);
    expect(ingresoDelMes(SEED, '2027-01')).toBe(4065000);
  });
  it('cuotas de nov 2026 y total de cuotas del plan', () => {
    expect(Math.round(mes('2026-11').cuotas)).toBe(540204);
    expect(Math.round(plan.resumen.totalCuotasPlan)).toBe(1287526);
    expect(Math.round(plan.meses.reduce((a, m) => a + m.cuotas, 0))).toBe(1287526);
  });
  it('gastos estimados por mes', () => {
    expect(gastosEstimados(SEED)).toBe(273750);
    expect(mes('2027-03').gastos).toBe(273750);
  });
  it('total ahorro hasta julio 2027', () => {
    expect(plan.resumen.totalAhorroPesosHastaMeta).toBeCloseTo(27526475, 2);
    expect(plan.resumen.totalAhorroUsdHastaMeta.toFixed(2)).toBe('17759.02');
  });
  it('USD proyectados a la meta y estado', () => {
    expect(plan.resumen.usdProyectados.toFixed(2)).toBe('19859.02');
    expect(plan.resumen.estado).toBe('META CUMPLIDA');
    expect(plan.resumen.cumplida).toBe(true);
  });
});

describe('reglas', () => {
  it('meses', () => {
    expect(sumarMeses('2026-11', 2)).toBe('2027-01');
    expect(sumarMeses('2027-01', -1)).toBe('2026-12');
    expect(plan.meses).toHaveLength(14);
    expect(plan.meses.at(-1)!.mes).toBe('2027-12');
  });
  it('la comisión se cobra el mes siguiente', () => {
    expect(mes('2026-11').mesFacturado).toBe('2026-10');
    expect(mes('2026-11').comision).toBe(600000);
  });
  it('aguinaldo en junio y diciembre: mitad del sueldo base', () => {
    expect(mes('2026-12').aguinaldo).toBe(987500);
    expect(mes('2027-06').aguinaldo).toBe(987500);
    expect(mes('2027-01').aguinaldo).toBe(0);
  });
  it('cuotas: último pago, total que falta, activa', () => {
    const fr = SEED.cuotas.find(c => c.concepto === 'Frávega')!;
    expect(ultimoPago(fr)).toBe('2027-03');
    expect(totalQueFalta(fr)).toBe(532070);
    expect(cuotaActiva(fr, '2027-03')).toBe(true);
    expect(cuotaActiva(fr, '2027-04')).toBe(false);
    expect(mes('2026-12').cuotasDetalle.find(c => c.concepto === 'Frávega')!.numero).toBe(2);
  });
  it('ahorro actual: USD + pesos ÷ dólar (pesos es input, no se calcula)', () => {
    expect(ahorroActualUsd(SEED)).toBe(2100);
  });
  it('% manual pisa al automático; sin override usa el automático', () => {
    expect(mes('2026-11').pct).toBe(0.6);
    const sinOv = calcularPlan({ ...SEED, overrides: [] });
    const r = sinOv.resumen;
    expect(r.usdFaltan).toBe(12900);
    expect(r.mesesHastaMeta).toBe(9);
    // % automático = igual para todos los meses hasta la meta (53,9% en la planilla)
    expect(r.pctNecesario.toFixed(3)).toBe('0.539');
    expect(sinOv.meses[0].pct).toBe(r.pctNecesario);
    expect(sinOv.meses.find(m => m.mes === '2027-07')!.pct).toBe(r.pctNecesario);
    // con el % automático se ahorra justo lo necesario → llega exacto a la meta
    expect(r.usdProyectados).toBeCloseTo(15000, 6);
    expect(sinOv.meses.find(m => m.mes === '2027-08')!.pct).toBe(0);
  });
  it('te queda libre', () => {
    const m = mes('2026-11');
    expect(Math.round(m.libre)).toBe(Math.round(3725000 - 2235000 - 540204.12 - 273750));
  });
  it('valores de la planilla: ahorro necesario', () => {
    expect(plan.resumen.ahorroMensualUsd.toFixed(2)).toBe('1433.33');
    expect(Math.round(plan.resumen.ahorroMensualPesos)).toBe(2221667);
    expect(plan.resumen.lectura).toBe('exigente pero posible');
    expect(mes('2026-11').pctAuto.toFixed(3)).toBe('0.539');
  });
  it('lectura', () => {
    expect(lecturaDe(1.2)).toBe('imposible');
    expect(lecturaDe(0.8)).toBe('muy exigente');
    expect(lecturaDe(0.6)).toBe('exigente pero posible');
    expect(lecturaDe(0.3)).toBe('cómodo');
  });
  it('mes actual del plan', () => {
    const ms = plan.meses.map(m => m.mes);
    expect(mesActualDelPlan(ms, '2026-10')).toBe('2026-11');
    expect(mesActualDelPlan(ms, '2027-02')).toBe('2027-02');
  });
});

describe('formatos', () => {
  it('pesos y dólares', () => {
    expect(fmtArs(1234567)).toBe('$ 1.234.567');
    expect(fmtUsd(1234.56)).toBe('U$S 1.234,56');
  });
});
