import { useEffect, useRef } from 'react';
import type { MesCalc } from '../../../lib/finanzas/calc';

const M = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/** Tira deslizable de meses. La barrita muestra el progreso acumulado hacia la meta (verde al llegar). */
export function MonthStrip({ meses, sel, onSel, hoy, meta }: { meses: MesCalc[]; sel: string; onSel: (m: string) => void; hoy: string; meta: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('.mp.on');
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [sel]);
  return (
    <div className="strip-w">
      <div className="strip" ref={ref} role="tablist" aria-label="Meses del plan">
        {meses.map(m => {
          const [y, mm] = m.mes.split('-').map(Number);
          return (
            <button key={m.mes} role="tab" aria-selected={m.mes === sel}
              className={`mp ${m.mes === sel ? 'on' : ''} ${m.hastaMeta ? '' : 'post'} ${m.libre < 0 ? 'neg' : ''} ${m.usdAcumulados >= meta ? 'ok' : ''}`}
              onClick={() => onSel(m.mes)}>
              <span className="mp-m">{M[mm - 1]}</span>
              <span className="mp-y">{String(y).slice(2)}</span>
              <span className="mp-bar"><i style={{ height: `${Math.max(6, Math.min(1, m.usdAcumulados / meta) * 100)}%` }} /></span>
              <span className="mp-p num">{Math.round((m.usdAcumulados / meta) * 100)}%</span>
              <span className="mp-tags">
                {m.esMesMeta && <em title="Mes de la meta">🎯</em>}
                {m.aguinaldo > 0 && <em className="dot ag" title="Aguinaldo" />}
                {m.mes === hoy && <em className="dot hoy" title="Mes actual" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
