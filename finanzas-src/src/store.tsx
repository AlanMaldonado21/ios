import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cuotaDesdeGasto, type Checks, type GastoDiario } from '../../lib/finanzas/diario';
import { calcularPlan } from '../../lib/finanzas/calc';
import { DATOS_INICIALES } from '../../lib/finanzas/seed';
import type { FinData } from '../../lib/finanzas/types';

// Los datos viven en este dispositivo (localStorage); si hay sesión, sync.js copia el documento a Supabase.
const LS = 'finanzas-v1';

type Estado = { data: FinData; checks: Checks; gastos: GastoDiario[]; topes: Record<string, number> };

const copiaSeed = (): FinData => JSON.parse(JSON.stringify(DATOS_INICIALES));

function cargar(): Estado {
  try {
    const s = JSON.parse(localStorage.getItem(LS) || 'null');
    if (s && typeof s === 'object') {
      const data: FinData = s.data && s.data.settings ? s.data : copiaSeed();
      if (!s.data && Number(s.dolar)) data.settings.dolar = Number(s.dolar); // formato viejo
      // Corrección: el ahorro en pesos de la planilla era el mismo ahorro en USD pasado a pesos.
      if (!s.fixAhorro && data.settings.ahorroUsdActual === 1050 && data.settings.ahorroPesosActual === 1627500) data.settings.ahorroPesosActual = 0;
      return { data, checks: s.checks || {}, gastos: Array.isArray(s.gastos) ? s.gastos : [], topes: s.topes && typeof s.topes === 'object' ? s.topes : {} };
    }
  } catch { /* sin datos */ }
  return { data: copiaSeed(), checks: {}, gastos: [], topes: {} };
}

type Ctx = Estado & {
  dolar: number;
  /** Tacha/destacha un mes. usd = lo que se separó (queda congelado). */
  toggleCheck: (mes: string, usd: number) => void;
  /** Tacha un mes con el monto real separado (o lo corrige si ya estaba tachado). */
  marcarCheck: (mes: string, usd: number) => void;
  desmarcarCheck: (mes: string) => void;
  agregarGasto: (g: Omit<GastoDiario, 'id'>) => string;
  borrarGasto: (id: string) => void;
  setDolar: (d: number) => void;
  /** Tope de gasto manual de un mes (para meses fuera del plan). null lo borra. */
  setTope: (mes: string, monto: number | null) => void;
  /** Cambia los datos del plan (ingresos, cuotas, etc.). Se guarda y recalcula al instante. */
  editar: (fn: (d: FinData) => void) => void;
  guardado: number;
  /** Mes abierto en Inicio (no se guarda). null = mes actual. */
  /** Hoja de carga rápida de gasto abierta (no se guarda). */
  sheetGasto: boolean;
  setSheetGasto: (v: boolean) => void;
  /** Gasto que se está editando en la hoja (null = uno nuevo). */
  gastoEdit: GastoDiario | null;
  editarGasto: (g: GastoDiario | null) => void;
  guardarEdicion: (g: GastoDiario) => void;
  mesSel: string | null;
  setMesSel: (m: string | null) => void;
};

const C = createContext<Ctx | null>(null);
export const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const hoyMes = () => hoyISO().slice(0, 7);
export const nuevoId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Estado>(cargar);
  const [guardado, setGuardado] = useState(0);
  const [mesSel, setMesSel] = useState<string | null>(null);
  const [sheetGasto, setSheetGastoRaw] = useState(false);
  const [gastoEdit, setGastoEdit] = useState<GastoDiario | null>(null);
  const setSheetGasto = useCallback((v: boolean) => { setSheetGastoRaw(v); if (!v) setGastoEdit(null); }, []);
  const editarGasto = useCallback((g: GastoDiario | null) => { setGastoEdit(g); setSheetGastoRaw(!!g); }, []);
  const guardarEdicion = useCallback((g: GastoDiario) => setSt(s => ({ ...s, gastos: s.gastos.map(x => x.id === g.id ? g : x) })), []);
  const first = useRef(true);
  useEffect(() => { window.Sync?.register('finanzas', () => setSt(cargar())); }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try {
      const txt = JSON.stringify({ ...st, fixAhorro: true });
      if (txt === localStorage.getItem(LS)) return; // nada cambió (p. ej. el doble efecto de StrictMode al abrir)
      localStorage.setItem(LS, txt); setGuardado(Date.now());
      window.Sync?.touch('finanzas');
    } catch { /* lleno o bloqueado */ }
  }, [st]);

  const toggleCheck = useCallback((mes: string, usd: number) => setSt(s => {
    const checks = { ...s.checks };
    if (checks[mes]) delete checks[mes]; else checks[mes] = { fecha: hoyISO(), usd };
    return { ...s, checks };
  }), []);
  const marcarCheck = useCallback((mes: string, usd: number) => setSt(s => {
    const prev = s.checks[mes];
    const fecha = prev ? (typeof prev === 'string' ? prev : prev.fecha) : hoyISO();
    return { ...s, checks: { ...s.checks, [mes]: { fecha, usd } } };
  }), []);
  const desmarcarCheck = useCallback((mes: string) => setSt(s => {
    const checks = { ...s.checks }; delete checks[mes];
    return { ...s, checks };
  }), []);
  const agregarGasto = useCallback((g: Omit<GastoDiario, 'id'>) => {
    const id = nuevoId();
    setSt(s => ({ ...s, gastos: [{ ...g, id }, ...s.gastos] }));
    return id;
  }, []);
  const borrarGasto = useCallback((id: string) => setSt(s => ({ ...s, gastos: s.gastos.filter(g => g.id !== id) })), []);
  const editar = useCallback((fn: (d: FinData) => void) => setSt(s => {
    const data: FinData = JSON.parse(JSON.stringify(s.data));
    fn(data);
    return { ...s, data };
  }), []);
  const setTope = useCallback((mes: string, monto: number | null) => setSt(s => {
    const topes = { ...s.topes };
    if (monto && monto > 0) topes[mes] = monto; else delete topes[mes];
    return { ...s, topes };
  }), []);
  const setDolar = useCallback((dolar: number) => editar(d => { d.settings.dolar = dolar; }), [editar]);

  return <C.Provider value={{ ...st, dolar: st.data.settings.dolar, toggleCheck, marcarCheck, desmarcarCheck, agregarGasto, borrarGasto, setDolar, setTope, editar, guardado, sheetGasto, setSheetGasto, gastoEdit, editarGasto, guardarEdicion, mesSel, setMesSel }}>{children}</C.Provider>;
}

export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error('useStore fuera de StoreProvider');
  return c;
}

/** Check discreto "Guardado" que aparece un momento después de cada cambio. */
export function Guardado() {
  const { guardado } = useStore();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!guardado) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, [guardado]);
  return <div className={`saved ${show ? 'on' : ''}`} aria-live="polite">✓ Guardado</div>;
}

/** Datos del plan + compras con crédito del Diario convertidas en cuotas + el plan calculado. */
export function usePlan() {
  const { data: base, gastos } = useStore();
  const data = useMemo<FinData>(() => ({
    ...base,
    cuotas: [...base.cuotas, ...gastos.map(cuotaDesdeGasto).filter((c): c is NonNullable<typeof c> => !!c)],
  }), [base, gastos]);
  const plan = useMemo(() => calcularPlan(data), [data]);
  return { data, ...plan };
}
