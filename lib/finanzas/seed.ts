// Datos iniciales de la planilla. Se usan en tests y para generar el seed SQL.
import type { FinData } from './types';

const fact = (mes: string, monto: number) => ({ mes, monto });
const cuota = (id: string, concepto: string, tarjeta: string, cuotaMensual: number, cuotasRestantes: number) =>
  ({ id, concepto, tarjeta, cuotaMensual, cuotasRestantes, primerPago: '2026-11' });

export const SEED: FinData = {
  settings: {
    metaUsd: 15000, fechaMeta: '2027-07', dolar: 1550,
    ahorroUsdActual: 1050, ahorroPesosActual: 1627500,
    mesInicioPlan: '2026-11', mesesPlan: 14,
  },
  ingresosFijos: [
    { id: 'i1', nombre: 'Yagmour', montoMensual: 1975000, esBaseAguinaldo: true },
    { id: 'i2', nombre: 'Midway', montoMensual: 450000, esBaseAguinaldo: false },
    { id: 'i3', nombre: 'Rockeritos', montoMensual: 700000, esBaseAguinaldo: false },
  ],
  comisionPct: 0.04,
  facturacion: [
    fact('2026-10', 15000000), fact('2026-11', 19000000), fact('2026-12', 23500000),
    fact('2027-01', 17560000), fact('2027-02', 18500000), fact('2027-03', 19000000),
    fact('2027-04', 18760000), fact('2027-05', 30000000),
    ...['06', '07', '08', '09', '10', '11', '12'].map(m => fact(`2027-${m}`, 13500000)),
  ],
  cuotas: [
    cuota('c1', 'Rouge', 'BNA Visa', 128333.35, 2),
    cuota('c2', 'Frávega', 'BNA Visa', 106414, 5),
    cuota('c3', 'Nike Dunk', 'BNA Visa', 21777.66, 4),
    cuota('c4', 'Nike', 'BNA Visa', 20000, 1),
    cuota('c5', 'Regalo Día de la Madre', 'BNA Visa', 110000, 1),
    cuota('c6', 'Jumbo', 'BNA Visa', 49221.10, 1),
    cuota('c7', 'VTV', 'MercadoPago', 40458.01, 1),
    cuota('c8', 'Otras', 'MercadoPago', 64000, 3),
  ],
  gastosFijos: [
    { id: 'g1', concepto: 'Contador', montoMensual: 45000 },
    { id: 'g2', concepto: 'Telecentro', montoMensual: 45000 },
    { id: 'g3', concepto: 'Movistar', montoMensual: 25000 },
    { id: 'g4', concepto: 'Gas', montoMensual: 20000 },
    { id: 'g5', concepto: 'ABL', montoMensual: 20000 },
    { id: 'g6', concepto: 'Nafta', montoMensual: 80000 },
  ],
  suscripciones: [{ id: 's1', concepto: 'Anthropic', montoUsd: 25 }],
  overrides: [
    { mes: '2026-11', porcentajeManual: 0.6 },
    { mes: '2026-12', porcentajeManual: 0.75 },
    ...['01', '02', '03', '04', '05'].map(m => ({ mes: `2027-${m}`, porcentajeManual: 0.75 })),
    { mes: '2027-06', porcentajeManual: 0.8 },
    ...['07', '08', '09', '10', '11', '12'].map(m => ({ mes: `2027-${m}`, porcentajeManual: 0.75 })),
  ],
};

/**
 * Datos con los que arranca la app: vacíos, para que no viajen números personales en el código publicado.
 * SEED (arriba) replica la planilla y solo lo usan los tests; la app no lo importa.
 * Todo se carga en la app (Configuración, Ingresos, Cuotas, Gastos).
 */
export const DATOS_INICIALES: FinData = {
  settings: { metaUsd: 0, fechaMeta: '2027-07', dolar: 1500, ahorroUsdActual: 0, ahorroPesosActual: 0, mesInicioPlan: '2026-11', mesesPlan: 14 },
  ingresosFijos: [], comisionPct: 0, facturacion: [], cuotas: [], gastosFijos: [], suscripciones: [], overrides: [],
};
