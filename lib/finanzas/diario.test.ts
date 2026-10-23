import { describe, expect, it } from 'vitest';
import { ahorroReal, cuotaDesdeGasto, gastosAlContado, primerPagoCredito, agruparPorDia, gastosDelMes, parseMonto, resumenChecklist, totalGastos, totalPorMedio, totalPorTipo, type GastoDiario } from './diario';

const G: GastoDiario[] = [
  { id: '1', fecha: '2026-11-02', tipo: 'Comida', monto: 12000, medio: 'debito' },
  { id: '2', fecha: '2026-11-02', tipo: 'Súper', monto: 45000, medio: 'credito' },
  { id: '3', fecha: '2026-11-05', tipo: 'Comida', monto: 8000, medio: 'transferencia' },
  { id: '4', fecha: '2026-12-01', tipo: 'Salidas', monto: 30000, medio: 'credito' },
];

describe('gastos diarios', () => {
  it('parsea montos en formato argentino', () => {
    expect(parseMonto('1.234.567')).toBe(1234567);
    expect(parseMonto('$ 12.500,50')).toBe(12500.5);
    expect(parseMonto('abc')).toBeNaN();
    expect(parseMonto('')).toBeNaN();
  });
  it('filtra por mes y suma', () => {
    const nov = gastosDelMes(G, '2026-11');
    expect(nov).toHaveLength(3);
    expect(totalGastos(nov)).toBe(65000);
  });
  it('totales por medio y por tipo', () => {
    const nov = gastosDelMes(G, '2026-11');
    expect(totalPorMedio(nov)).toEqual({ credito: 45000, debito: 12000, transferencia: 8000 });
    expect(totalPorTipo(nov)[0]).toEqual({ tipo: 'Súper', total: 45000 });
    expect(totalPorTipo(nov).find(t => t.tipo === 'Comida')!.total).toBe(20000);
  });
  it('agrupa por día, más nuevo primero', () => {
    const d = agruparPorDia(gastosDelMes(G, '2026-11'));
    expect(d.map(x => x.fecha)).toEqual(['2026-11-05', '2026-11-02']);
    expect(d[1].total).toBe(57000);
  });
});

describe('checklist de ahorro', () => {
  it('cuenta meses cumplidos y USD', () => {
    const meses = [{ mes: '2026-11', ahorroUsd: 1000 }, { mes: '2026-12', ahorroUsd: 2000 }, { mes: '2027-01', ahorroUsd: 1500 }];
    const r = resumenChecklist(meses, { '2026-11': '2026-11-05', '2027-01': '2027-01-03' });
    expect(r).toEqual({ cumplidos: 2, total: 3, usdCumplidos: 2500, usdTotal: 4500 });
  });
});

describe('compras con crédito', () => {
  it('BNA: hasta el cierre (22) se paga el mes siguiente; después, el otro', () => {
    expect(primerPagoCredito('2026-10-22', 'BNA Visa')).toBe('2026-11');
    expect(primerPagoCredito('2026-10-23', 'BNA Visa')).toBe('2026-12');
    expect(primerPagoCredito('2026-12-28', 'BNA Visa')).toBe('2027-02');
    expect(primerPagoCredito('2026-10-28', 'MercadoPago')).toBe('2026-11');
  });
  it('se convierte en cuota del plan', () => {
    const c = cuotaDesdeGasto({ id: 'x', fecha: '2026-11-10', tipo: 'Zapatillas', monto: 120000, medio: 'credito', tarjeta: 'BNA Visa', cuotas: 6 })!;
    expect(c).toMatchObject({ concepto: 'Zapatillas', tarjeta: 'BNA Visa', cuotaMensual: 20000, cuotasRestantes: 6, primerPago: '2026-12', origen: 'x' });
    expect(cuotaDesdeGasto({ id: 'y', fecha: '2026-11-10', tipo: 'Café', monto: 3000, medio: 'debito' })).toBeNull();
  });
  it('el crédito no cuenta como gasto al contado del mes', () => {
    expect(totalGastos(gastosAlContado(gastosDelMes(G, '2026-11')))).toBe(20000);
  });
});

describe('ahorro real con el checklist', () => {
  const meses = [{ mes: '2026-11', ahorroUsd: 1441.94 }, { mes: '2026-12', ahorroUsd: 2357.66 }, { mes: '2027-01', ahorroUsd: 1966.94 }];
  it('tachar noviembre suma sus USD a lo que tenés', () => {
    expect(ahorroReal(1050, meses, {}).real).toBe(1050);
    const r = ahorroReal(1050, meses, { '2026-11': { fecha: '2026-11-05', usd: 1441.94 } }, '2026-11');
    expect(r.real.toFixed(2)).toBe('2491.94');
    expect(r.pendiente).toBe(0);
  });
  it('hasta un mes: lo no tachado queda pendiente', () => {
    const r = ahorroReal(1050, meses, { '2026-11': '2026-11-05' }, '2026-12');
    expect(r.real.toFixed(2)).toBe('2491.94');
    expect(r.pendiente).toBe(2357.66);
  });
  it('el monto tachado queda congelado aunque cambie el plan', () => {
    const r = resumenChecklist(meses, { '2026-11': { fecha: '2026-11-05', usd: 1500 } });
    expect(r.usdCumplidos).toBe(1500);
  });
});

import { ritmoMes } from './diario';
describe('ritmoMes', () => {
  const g = (fecha: string, monto: number, medio: 'debito' | 'credito' = 'debito') => ({ id: fecha + monto, fecha, tipo: 'Comida', monto, medio });
  it('sin tope: promedio y proyección, el crédito no cuenta', () => {
    const r = ritmoMes([g('2026-10-02', 100000), g('2026-10-20', 210000), g('2026-10-21', 999999, 'credito'), g('2026-09-30', 5)], null, '2026-10-23');
    expect(r.gastado).toBe(310000);
    expect(r.diasMes).toBe(31);
    expect(r.diasRestantes).toBe(9);
    expect(Math.round(r.proyeccion)).toBe(Math.round(310000 / 23 * 31));
    expect(r.tope).toBeNull();
  });
  it('con tope: queda, por día y nivel', () => {
    const r = ritmoMes([g('2026-10-23', 100000)], 310000, '2026-10-23');
    expect(r.hoy).toBe(100000);
    expect(r.quedan).toBe(210000);
    expect(r.porDia).toBeCloseTo(210000 / 9);
    expect(r.nivel).toBe('pos');
    expect(ritmoMes([g('2026-10-05', 250000)], 310000, '2026-10-23').nivel).toBe('warn');
    expect(ritmoMes([g('2026-10-05', 400000)], 310000, '2026-10-23').nivel).toBe('neg');
  });
});
