import { createContext, useContext, useState, type ReactNode } from 'react';
import { fmtArs, fmtUsd } from '../../../lib/finanzas/format';

const LS = 'finanzas-ocultar-v1';
const Ctx = createContext<{ oculto: boolean; alternar: () => void }>({ oculto: false, alternar: () => {} });

/** Ojito tipo Mercado Pago: con los montos ocultos se ve "$ ***". Se acuerda del último estado en este dispositivo. */
export function OcultoProvider({ children }: { children: ReactNode }) {
  const [oculto, setOculto] = useState(() => { try { return localStorage.getItem(LS) === '1'; } catch { return false; } });
  const alternar = () => setOculto(o => { try { localStorage.setItem(LS, o ? '0' : '1'); } catch { /* sin storage */ } return !o; });
  return <Ctx.Provider value={{ oculto, alternar }}>{children}</Ctx.Provider>;
}

/** Igual que fmtArs/fmtUsd, pero devuelven "$ ***" / "U$S ***" cuando los montos están ocultos. */
export function useOculto() {
  const { oculto, alternar } = useContext(Ctx);
  const ars = (n: number) => (oculto ? '$ ***' : fmtArs(n));
  const usd = (n: number, decimales?: number) => (oculto ? 'U$S ***' : fmtUsd(n, decimales));
  return { oculto, alternar, ars, usd };
}

export function Ojito() {
  const { oculto, alternar } = useOculto();
  return (
    <button className="ojito" onClick={alternar} aria-pressed={oculto} aria-label={oculto ? 'Mostrar montos' : 'Ocultar montos'}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {oculto
          ? <path d="M3 13c3 4 15 4 18 0M6 16l-1.5 2.5M12 17.5V20M18 16l1.5 2.5" />
          : <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>}
      </svg>
    </button>
  );
}
