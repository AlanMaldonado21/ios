// Pagos marcados a mano ("ya lo pagué") y cobro del mes ("ya cobré"). Lógica pura.
import type { MesCalc } from './calc';
import type { FinData, Mes } from './types';

/** Conjunto de claves marcadas. */
export type Marcas = Record<string, true>;
export type TipoPago = 'f' | 's' | 'c'; // fijo, suscripción USD, cuota

export const kPago = (mes: Mes, tipo: TipoPago, id: string) => `${mes}|${tipo}|${id}`;

export type TipoCobro = 'i' | 'k' | 'a'; // ingreso fijo, comisión, aguinaldo
export const kCobro = (mes: Mes, tipo: TipoCobro, id = '') => `${mes}|${tipo}|${id}`;

export type FuenteCobro = { clave: string; nombre: string; monto: number };
/** Cada lugar de donde entra plata en el mes, para marcar si ya cobraste. */
export function fuentesDeCobro(m: MesCalc, data: FinData): FuenteCobro[] {
  return [
    ...data.ingresosFijos.map(i => ({ clave: kCobro(m.mes, 'i', i.id), nombre: i.nombre || 'Sin nombre', monto: i.montoMensual })),
    { clave: kCobro(m.mes, 'k'), nombre: 'Comisión por ventas', monto: m.comision },
    ...(m.aguinaldo > 0 ? [{ clave: kCobro(m.mes, 'a'), nombre: 'Aguinaldo', monto: m.aguinaldo }] : []),
  ];
}

export type Caja = {
  /** Cobraste al menos una fuente. */
  cobrado: boolean;
  /** Suma de las fuentes que marcaste como cobradas. */
  entro: number;
  /** Fijos + suscripciones + cuotas marcados como pagados. */
  pagado: number;
  /** Lo mismo, lo que todavía no marcaste. */
  falta: number;
  /** Ahorro del mes si ya lo separaste (mes tachado en el checklist). */
  ahorro: number;
  /** Gastos al contado del Diario. */
  gastado: number;
  /** Plata en mano: lo cobrado menos lo pagado, lo ahorrado y lo gastado. */
  enMano: number;
};

export function cajaDelMes(m: MesCalc, data: FinData, pagos: Marcas, cobros: Marcas, ahorroSeparado: boolean, gastado: number): Caja {
  const dolar = data.settings.dolar;
  const items: [string, number][] = [
    ...data.gastosFijos.map(g => [kPago(m.mes, 'f', g.id), g.montoMensual] as [string, number]),
    ...data.suscripciones.map(s => [kPago(m.mes, 's', s.id), s.montoUsd * dolar] as [string, number]),
    ...m.cuotasDetalle.map(c => [kPago(m.mes, 'c', c.id), c.monto] as [string, number]),
  ];
  let pagado = 0, falta = 0;
  for (const [k, v] of items) { if (pagos[k]) pagado += v; else falta += v; }
  // cobros[mes] solo existe en datos de la primera versión: significaba "cobré todo".
  const entro = cobros[m.mes] ? m.ingresoTotal : fuentesDeCobro(m, data).reduce((a, f) => a + (cobros[f.clave] ? f.monto : 0), 0);
  const cobrado = entro > 0;
  const ahorro = ahorroSeparado ? m.ahorroPesos : 0;
  return { cobrado, entro, pagado, falta, ahorro, gastado, enMano: entro - pagado - ahorro - gastado };
}
