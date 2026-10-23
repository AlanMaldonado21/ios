/** Mes en formato "YYYY-MM". */
export type Mes = string;

export type Settings = {
  metaUsd: number;
  fechaMeta: Mes;
  dolar: number;
  ahorroUsdActual: number;
  /** Ingresado a mano. NO se calcula desde los USD. */
  ahorroPesosActual: number;
  mesInicioPlan: Mes;
  mesesPlan: number;
};

export type IngresoFijo = { id: string; nombre: string; montoMensual: number; esBaseAguinaldo: boolean };
export type Facturacion = { mes: Mes; monto: number };
export type Cuota = { id: string; concepto: string; tarjeta: string; cuotaMensual: number; cuotasRestantes: number; primerPago: Mes };
export type GastoFijo = { id: string; concepto: string; montoMensual: number };
export type SuscripcionUsd = { id: string; concepto: string; montoUsd: number };
export type Override = { mes: Mes; porcentajeManual: number | null };

export type FinData = {
  settings: Settings;
  ingresosFijos: IngresoFijo[];
  /** 0.04 = 4% */
  comisionPct: number;
  facturacion: Facturacion[];
  cuotas: Cuota[];
  gastosFijos: GastoFijo[];
  suscripciones: SuscripcionUsd[];
  overrides: Override[];
};
