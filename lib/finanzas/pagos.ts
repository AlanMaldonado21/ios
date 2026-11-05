// Pagos marcados a mano ("ya lo pagué") y cobro del mes ("ya cobré"). Lógica pura.
import type { MesCalc } from './calc';
import type { FinData, Mes } from './types';

/** Conjunto de claves marcadas. */
export type Marcas = Record<string, true>;
export type TipoPago = 'f' | 's' | 'c'; // fijo, suscripción USD, cuota

export const kPago = (mes: Mes, tipo: TipoPago, id: string) => `${mes}|${tipo}|${id}`;

export type Caja = {
  cobrado: boolean;
  /** Ingreso del mes si ya cobraste, 0 si no. */
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
  const cobrado = !!cobros[m.mes];
  const entro = cobrado ? m.ingresoTotal : 0;
  const ahorro = ahorroSeparado ? m.ahorroPesos : 0;
  return { cobrado, entro, pagado, falta, ahorro, gastado, enMano: entro - pagado - ahorro - gastado };
}
