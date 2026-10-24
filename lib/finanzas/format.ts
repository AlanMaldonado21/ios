// Formatos argentinos: $ 1.234.567 y U$S 1.234,56

const ars0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const num = (d: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Montos ocultos (ojito de privacidad): con la máscara puesta, los formateadores devuelven "$ ***". */
let mascara = false;
export const setMascara = (v: boolean) => { mascara = v; };
export const hayMascara = () => mascara;

export const fmtArs = (n: number) => mascara ? '$ ***' : `${n < 0 ? '−' : ''}$ ${ars0.format(Math.abs(Math.round(n)))}`;
export const fmtUsd = (n: number, decimales = 2) => mascara ? 'U$S ***' : `${n < 0 ? '−' : ''}U$S ${num(decimales).format(Math.abs(n))}`;
export const fmtPct = (n: number, decimales = 0) => `${num(decimales).format(n * 100)}%`;

/** Abrevia montos grandes para ejes: $ 3,7 M */
export function fmtArsCorto(n: number) {
  if (mascara) return '$ ***';
  const a = Math.abs(n);
  if (a >= 1e6) return `$ ${num(1).format(n / 1e6)} M`;
  if (a >= 1e3) return `$ ${num(0).format(n / 1e3)} k`;
  return `$ ${ars0.format(n)}`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "2026-11" → "nov 26" */
export function mesCorto(m: string) {
  const [y, mm] = m.split('-').map(Number);
  return `${MESES[mm - 1]} ${String(y).slice(2)}`;
}
/** "2026-11" → "noviembre 2026" */
export function mesLargo(m: string) {
  const [y, mm] = m.split('-').map(Number);
  return `${MESES_LARGOS[mm - 1]} ${y}`;
}
