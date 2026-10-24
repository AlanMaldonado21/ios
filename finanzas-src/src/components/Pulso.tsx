import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { fmtPct, hayMascara } from '../../../lib/finanzas/format';
import type { Pulso as P } from '../comun.d';

/**
 * Indicador común a los dos módulos, en una línea: semana de hábitos · registro de gastos · rumbo a la meta.
 * Mismos datos y mismo texto que en Hábitos (ui/comun.js).
 */
export function Pulso() {
  const { guardado } = useStore();
  const [p, setP] = useState<P | null>(() => window.Comun?.pulso() ?? null);
  useEffect(() => { setP(window.Comun?.pulso() ?? null); }, [guardado]);
  useEffect(() => {
    const f = () => { if (!document.hidden) setP(window.Comun?.pulso() ?? null); };
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);
  if (!p || (!p.habitos && !p.registro && !p.meta)) return null;
  return (
    <p className="pulso" aria-label="Resumen de la semana">
      {p.habitos && (
        <a href="../#prog" className={p.habitos.estado === 'buena' ? 'ok' : ''}>
          {p.habitos.estado === 'buena'
            ? <>Semana buena · <b className="num">{p.habitos.cumplidos}</b> {p.habitos.cumplidos === 1 ? 'día' : 'días'}</>
            : <>Semana <b className="num">{p.habitos.cumplidos} de {p.habitos.minimo}</b> días</>}
        </a>
      )}
      {p.registro && <a href="#/diario">Registro <b className="num">{p.registro.dias} {p.registro.dias === 1 ? 'día' : 'días'}</b></a>}
      {p.meta && <a href="#/plan">Meta <b className="num">{hayMascara() ? '**%' : fmtPct(Math.min(p.meta.pct, 9.99))}</b></a>}
    </p>
  );
}
