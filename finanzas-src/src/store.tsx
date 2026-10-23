import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cuotaDesdeGasto, type Checks, type GastoDiario } from '../../lib/finanzas/diario';
import { calcularPlan } from '../../lib/finanzas/calc';
import { SEED } from '../../lib/finanzas/seed';
import type { FinData } from '../../lib/finanzas/types';

// Por ahora los datos viven en este dispositivo (localStorage), igual que hábitos.
// Cuando se conecte Supabase, esto se reemplaza por las tablas fin_*.
const LS = 'finanzas-v1';

type Estado = { data: FinData; checks: Checks; gastos: GastoDiario[] };

const copiaSeed = (): FinData => JSON.parse(JSON.stringify(SEED));

function cargar(): Estado {
  try {
    const s = JSON.parse(localStorage.getItem(LS) || 'null');
    if (s && typeof s === 'object') {
      const data: FinData = s.data && s.data.settings ? s.data : copiaSeed();
      if (!s.data && Number(s.dolar)) data.settings.dolar = Number(s.dolar); // formato viejo
      return { data, checks: s.checks || {}, gastos: Array.isArray(s.gastos) ? s.gastos : [] };
    }
  } catch { /* sin datos */ }
  return { data: copiaSeed(), checks: {}, gastos: [] };
}

type Ctx = Estado & {
  dolar: number;
  toggleCheck: (mes: string) => void;
  agregarGasto: (g: Omit<GastoDiario, 'id'>) => void;
  borrarGasto: (id: string) => void;
  setDolar: (d: number) => void;
  /** Cambia los datos del plan (ingresos, cuotas, etc.). Se guarda y recalcula al instante. */
  editar: (fn: (d: FinData) => void) => void;
  guardado: number;
  /** Mes abierto en Inicio (no se guarda). null = mes actual. */
  mesSel: string | null;
  setMesSel: (m: string | null) => void;
};

const C = createContext<Ctx | null>(null);
export const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const nuevoId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Estado>(cargar);
  const [guardado, setGuardado] = useState(0);
  const [mesSel, setMesSel] = useState<string | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try { localStorage.setItem(LS, JSON.stringify(st)); setGuardado(Date.now()); } catch { /* lleno o bloqueado */ }
  }, [st]);

  const toggleCheck = useCallback((mes: string) => setSt(s => {
    const checks = { ...s.checks };
    if (checks[mes]) delete checks[mes]; else checks[mes] = hoyISO();
    return { ...s, checks };
  }), []);
  const agregarGasto = useCallback((g: Omit<GastoDiario, 'id'>) => setSt(s => ({ ...s, gastos: [{ ...g, id: nuevoId() }, ...s.gastos] })), []);
  const borrarGasto = useCallback((id: string) => setSt(s => ({ ...s, gastos: s.gastos.filter(g => g.id !== id) })), []);
  const editar = useCallback((fn: (d: FinData) => void) => setSt(s => {
    const data: FinData = JSON.parse(JSON.stringify(s.data));
    fn(data);
    return { ...s, data };
  }), []);
  const setDolar = useCallback((dolar: number) => editar(d => { d.settings.dolar = dolar; }), [editar]);

  return <C.Provider value={{ ...st, dolar: st.data.settings.dolar, toggleCheck, agregarGasto, borrarGasto, setDolar, editar, guardado, mesSel, setMesSel }}>{children}</C.Provider>;
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
