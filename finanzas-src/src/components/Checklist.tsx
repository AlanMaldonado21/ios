import type { MesCalc } from '../../../lib/finanzas/calc';
import { resumenChecklist } from '../../../lib/finanzas/diario';
import { fmtArs, fmtPct, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { useStore } from '../store';

const fechaCorta = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(d)}/${Number(m)}`; };

/** Checklist de ahorro: cuánto hay que separar cada mes. Se tacha al cumplirlo. */
export function Checklist({ meses, sel, onSel }: { meses: MesCalc[]; sel: string; onSel: (m: string) => void }) {
  const { checks, toggleCheck } = useStore();
  const r = resumenChecklist(meses, checks);
  const p = r.usdTotal ? r.usdCumplidos / r.usdTotal : 0;
  return (
    <section className="card pad0 chk-card">
      <div className="chk-top">
        <div className="ch" style={{ marginBottom: 6 }}>
          <h2>Ahorro mes a mes</h2>
          <span className="tag t-pos">{r.cumplidos} de {r.total} cumplidos</span>
        </div>
        <div className="chk-sum">
          <b className="num">{fmtUsd(r.usdCumplidos, 0)}</b>
          <span className="num">separados de {fmtUsd(r.usdTotal, 0)}</span>
        </div>
        <div className="pbar"><i style={{ width: `${p * 100}%`, background: 'linear-gradient(90deg,var(--pos),#a3ef6c)' }} /></div>
      </div>
      <ul className="chk-list">
        {meses.map(m => {
          const ok = !!checks[m.mes];
          return (
            <li key={m.mes} className={`${ok ? 'ok' : ''} ${m.hastaMeta ? '' : 'post'} ${m.mes === sel ? 'sel' : ''}`}>
              <button className="chk-b" onClick={() => toggleCheck(m.mes)} aria-pressed={ok} aria-label={`${ok ? 'Desmarcar' : 'Marcar'} ${mesLargo(m.mes)}`}>
                <svg viewBox="0 0 24 24" aria-hidden><path d="M6 12.5l4 4 8-9" /></svg>
              </button>
              <button className="chk-row" onClick={() => onSel(m.mes)}>
                <span className="chk-m">
                  <b>{mesLargo(m.mes)}</b>
                  <small>{ok ? `cumplido el ${fechaCorta(checks[m.mes])}` : `${fmtPct(m.pct)} · ${fmtArs(m.ahorroPesos)}`}{m.esMesMeta ? ' · 🎯' : ''}</small>
                </span>
                <b className="chk-v num">{fmtUsd(m.ahorroUsd, 0)}</b>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
