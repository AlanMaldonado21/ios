import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Checks, GastoDiario } from '../../lib/finanzas/diario';
import { calcularPlan } from '../../lib/finanzas/calc';
import { SEED } from '../../lib/finanzas/seed';

// Por ahora los datos viven en este dispositivo (localStorage), igual que hábitos.
// Cuando se conecte Supabase, esto se reemplaza por las tablas fin_*.
const LS = 'finanzas-v1';

type Estado = { checks: Checks; gastos: GastoDiario[]; dolar: number };

function cargar(): Estado {
  try {
    const s = JSON.parse(localStorage.getItem(LS) || 'null');
    if (s && typeof s === 'object') return { checks: s.checks || {}, gastos: Array.isArray(s.gastos) ? s.gastos : [], dolar: Number(s.dolar) || SEED.settings.dolar };
  } catch { /* sin datos */ }
  return { checks: {}, gastos: [], dolar: SEED.settings.dolar };
}

type Ctx = Estado & {
  toggleCheck: (mes: string) => void;
  agregarGasto: (g: Omit<GastoDiario, 'id'>) => void;
  borrarGasto: (id: string) => void;
  setDolar: (d: number) => void;
  guardado: number;
};

const C = createContext<Ctx | null>(null);
export const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Estado>(cargar);
  const [guardado, setGuardado] = useState(0);
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
  const agregarGasto = useCallback((g: Omit<GastoDiario, 'id'>) => setSt(s => ({
    ...s, gastos: [{ ...g, id: Math.random().toString(36).slice(2, 9) + Date.now().toString(36) }, ...s.gastos],
  })), []);
  const setDolar = useCallback((dolar: number) => setSt(s => ({ ...s, dolar })), []);
  const borrarGasto = useCallback((id: string) => setSt(s => ({ ...s, gastos: s.gastos.filter(g => g.id !== id) })), []);

  return <C.Provider value={{ ...st, toggleCheck, agregarGasto, borrarGasto, setDolar, guardado }}>{children}</C.Provider>;
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

/** Datos del plan (por ahora el seed) + el plan calculado con el dólar elegido. */
export function usePlan() {
  const { dolar } = useStore();
  const data = useMemo(() => ({ ...SEED, settings: { ...SEED.settings, dolar } }), [dolar]);
  const plan = useMemo(() => calcularPlan(data), [data]);
  return { data, ...plan };
}
