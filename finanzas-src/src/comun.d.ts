export {};
type Semana = { desde: string; dias: { k: string; due: number; done: number; met: boolean; hoy: boolean; futuro: boolean }[]; cumplidos: number; minimo: number; conHabitos: number; estado: 'buena' | 'floja' | 'en curso' | 'libre'; posible: boolean };
export type Pulso = {
  habitos: { cumplidos: number; minimo: number; estado: Semana['estado']; racha: number } | null;
  registro: { dias: number; hoy: boolean } | null;
  meta: { pct: number; real: number; meta: number } | null;
};
export type ResumenSemana = {
  desde: string; hasta: string; habitos: Semana | null;
  gastos: { cargados: number; dias: number } | null;
  ahorro: { usdSemana: number; real: number | null; meta: number | null } | null;
};
declare global {
  interface Window {
    Comun?: {
      key: (d: Date) => string; parse: (k: string) => Date; addDays: (d: Date, n: number) => Date; lunes: (d: Date) => Date; hoyK: () => string;
      privado: () => boolean; setPrivado: (v: boolean) => void; onPrivado: (f: (v: boolean) => void) => void;
      haptic: (ms?: number) => void; chispas: (el: Element | null) => void; reduce: () => boolean;
      rachaRegistro: (f: unknown) => { dias: number; hoy: boolean };
      caminoAhorro: (meta: number) => number[];
      resumenSemana: (desde?: Date) => ResumenSemana;
      pulso: () => Pulso;
      fraseSemana: (se: Semana) => string;
      RES: string;
    };
  }
}
