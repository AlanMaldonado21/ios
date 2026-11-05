import { describe, expect, it } from 'vitest';
import { calcularPlan } from './calc';
import { cajaDelMes, kPago } from './pagos';
import { SEED } from './seed';

const data = JSON.parse(JSON.stringify(SEED));
const m = calcularPlan(data).meses[0];

describe('cajaDelMes', () => {
  it('sin marcar: nada cobrado ni pagado, todo falta', () => {
    const c = cajaDelMes(m, data, {}, {}, false, 0);
    expect(c.entro).toBe(0);
    expect(c.pagado).toBe(0);
    expect(c.falta).toBeCloseTo(m.gastos + m.cuotas);
    expect(c.enMano).toBe(0);
  });
  it('cobrar suma el ingreso; pagar descuenta de la caja', () => {
    const g = data.gastosFijos[0];
    const c = cajaDelMes(m, data, { [kPago(m.mes, 'f', g.id)]: true }, { [m.mes]: true }, false, 1000);
    expect(c.entro).toBe(m.ingresoTotal);
    expect(c.pagado).toBe(g.montoMensual);
    expect(c.enMano).toBeCloseTo(m.ingresoTotal - g.montoMensual - 1000);
  });
  it('si ya separaste el ahorro, también se descuenta', () => {
    const c = cajaDelMes(m, data, {}, { [m.mes]: true }, true, 0);
    expect(c.enMano).toBeCloseTo(m.ingresoTotal - m.ahorroPesos);
  });
  it('pagado + falta = fijos + suscripciones + cuotas', () => {
    const g = data.gastosFijos[0];
    const c = cajaDelMes(m, data, { [kPago(m.mes, 'f', g.id)]: true }, {}, false, 0);
    expect(c.pagado + c.falta).toBeCloseTo(m.gastos + m.cuotas);
  });
});
