// DATOS FALSOS para la maqueta del Dashboard. Se reemplaza por calc.ts + Supabase.
export type MesPlan = {
  mes: string; ingreso: number; aguinaldo: number; pct: number; ahorroPesos: number;
  ahorroUsd: number; usdAcum: number; cuotas: number; gastos: number; libre: number; postMeta: boolean;
};

const dolar = 1550;
const base = 2100;
const filas: [string, number, number, number, number][] = [
  // mes, ingreso, aguinaldo, %, cuotas
  ['2026-11', 3725000, 0, 0.6, 540204],
  ['2026-12', 3885000, 987500, 0.75, 320525],
  ['2027-01', 4065000, 0, 0.75, 192192],
  ['2027-02', 3827400, 0, 0.75, 128192],
  ['2027-03', 3865000, 0, 0.75, 106414],
  ['2027-04', 3885000, 0, 0.75, 0],
  ['2027-05', 3875400, 0, 0.75, 0],
  ['2027-06', 4325000, 987500, 0.8, 0],
  ['2027-07', 3665000, 0, 0.75, 0],
  ['2027-08', 3665000, 0, 0.75, 0],
  ['2027-09', 3665000, 0, 0.75, 0],
  ['2027-10', 3665000, 0, 0.75, 0],
  ['2027-11', 3665000, 0, 0.75, 0],
  ['2027-12', 3665000, 987500, 0.75, 0],
];

let acum = base;
export const mockPlan: MesPlan[] = filas.map(([mes, ingreso, aguinaldo, pct, cuotas]) => {
  const ahorroPesos = (ingreso + aguinaldo) * pct;
  const ahorroUsd = ahorroPesos / dolar;
  acum += ahorroUsd;
  const gastos = 273750;
  return { mes, ingreso, aguinaldo, pct, ahorroPesos, ahorroUsd, usdAcum: acum, cuotas, gastos,
    libre: ingreso + aguinaldo - ahorroPesos - cuotas - gastos, postMeta: mes > '2027-07' };
});

export const mockResumen = {
  meta: 15000,
  fechaMeta: '2027-07',
  dolar,
  proyectados: 19859.02,
  mesActual: '2026-12',
};
