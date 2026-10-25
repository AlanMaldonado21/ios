import type { MesCalc } from '../../../lib/finanzas/calc';
import { ahorroReal, fechaCheck, resumenChecklist, usdCheck } from '../../../lib/finanzas/diario';
import { fmtArs, fmtPct, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { useState } from 'react';
import { useStore } from '../store';
import { MoneyInput } from './MoneyInput';

const fechaCorta = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(d)}/${Number(m)}`; };

/** Checklist de ahorro: cuánto hay que separar cada mes. Se tacha al cumplirlo. */
export function Checklist({ meses, sel, onSel, base }: { meses: MesCalc[]; sel: string; onSel: (m: string) => void; base: number }) {
  const { checks, marcarCheck, desmarcarCheck } = useStore();
  // Mes que se está tachando/corrigiendo y el monto que se va a guardar
  const [ed, setEd] = useState<{ mes: string; usd: number } | null>(null);
  const abrirEd = (mes: string, usd: number) => setEd({ mes, usd: Math.round(usd * 100) / 100 });
  const r = resumenChecklist(meses, checks);
  const total = ahorroReal(base, meses, checks).real;
  const p = r.usdTotal ? r.usdCumplidos / r.usdTotal : 0;
  return (
    <section className="card pad0 chk-card">
      <div className="chk-top">
        <div className="ch" style={{ marginBottom: 6 }}>
          <h2>Ahorro mes a mes</h2>
          <span className="tag t-pos">{r.cumplidos} de {r.total} cumplidos</span>
        </div>
        <div className="chk-sum">
          <b className="num">{fmtUsd(total, 0)}</b>
          <span className="num">ahorrados de verdad</span>
        </div>
        <p className="chk-det num">{fmtUsd(base, 0)} que tenías + {fmtUsd(r.usdCumplidos, 0)} separados en {r.cumplidos} {r.cumplidos === 1 ? 'mes' : 'meses'}</p>
        <div className="regla"><i className="pos" style={{ width: `${p * 100}%` }} /></div>
      </div>
      <ul className="chk-list">
        {meses.map(m => {
          const ok = !!checks[m.mes];
          return (
            <li key={m.mes} className={`${ok ? 'ok' : ''} ${m.hastaMeta ? '' : 'post'} ${m.mes === sel ? 'sel' : ''}`}>
              <button className="chk-b" onClick={() => abrirEd(m.mes, ok ? usdCheck(checks[m.mes], m.ahorroUsd) : m.ahorroUsd)} aria-pressed={ok} aria-label={`${ok ? 'Editar' : 'Marcar'} ${mesLargo(m.mes)}`}>
                <svg viewBox="0 0 24 24" aria-hidden><path d="M6 12.5l4 4 8-9" /></svg>
              </button>
              <button className="chk-row" onClick={() => onSel(m.mes)}>
                <span className="chk-m">
                  <b>{mesLargo(m.mes)}</b>
                  <small>{ok ? `separado el ${fechaCorta(fechaCheck(checks[m.mes]))}` : `${fmtPct(m.pct)} · ${fmtArs(m.ahorroPesos)}`}{m.esMesMeta ? ' · mes de la meta' : ''}</small>
                </span>
                <b className="chk-v num">{fmtUsd(ok ? usdCheck(checks[m.mes], m.ahorroUsd) : m.ahorroUsd, 0)}</b>
              </button>
              {ed?.mes === m.mes && (
                <div className="chk-ed">
                  <span className="chk-ed-l">¿Cuánto separaste en {mesLargo(m.mes).split(' ')[0]}?</span>
                  <div className="chk-ed-r">
                    <MoneyInput value={ed.usd} prefijo="U$S" ariaLabel="Dólares separados" onChange={n => setEd({ mes: m.mes, usd: n })} />
                    <button className="btn-ok" disabled={!(ed.usd > 0)} onClick={e => { if (!ok) window.Comun?.chispas(e.currentTarget); marcarCheck(m.mes, ed.usd); setEd(null); }}>{ok ? 'Guardar' : 'Tachar'}</button>
                  </div>
                  <div className="chk-ed-f">
                    <span>El plan decía {fmtUsd(m.ahorroUsd, 0)}{ed.usd > 0 && Math.abs(ed.usd - m.ahorroUsd) >= 1 ? <b className={ed.usd >= m.ahorroUsd ? 'pos' : 'neg'}> · {ed.usd >= m.ahorroUsd ? '+' : '−'}{fmtUsd(Math.abs(ed.usd - m.ahorroUsd), 0)}</b> : null}</span>
                    <span>
                      {ok && <button className="lnk neg" onClick={() => { desmarcarCheck(m.mes); setEd(null); }}>Destachar</button>}
                      <button className="lnk" onClick={() => setEd(null)}>Cancelar</button>
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
