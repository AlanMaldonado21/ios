import type { MesCalc } from '../../../lib/finanzas/calc';
import { fmtPct, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { CountUp } from './CountUp';

/** Caja del mes: navegación + progreso hacia la meta al cierre de ese mes. */
export function MesBox({ m, ix, meses, meta, hoy, ir }: {
  m: MesCalc; ix: number; meses: MesCalc[]; meta: number; hoy: string; ir: (d: number) => void;
}) {
  const antes = m.usdAcumulados - m.ahorroUsd;
  const pAntes = Math.min(1, antes / meta);
  const pDesp = Math.min(1, m.usdAcumulados / meta);
  const ok = m.usdAcumulados >= meta;
  const nMeta = meses.filter(x => x.hastaMeta).length;
  // primer mes en que se llega a la meta
  const llega = meses.find(x => x.usdAcumulados >= meta);
  return (
    <section className={`mesbox ${ok ? 'ok' : ''}`}>
      <div className="mes-h">
        <button className="nav-b" onClick={() => ir(-1)} disabled={ix === 0} aria-label="Mes anterior">‹</button>
        <div className="mes-t">
          <h2 key={m.mes}>{mesLargo(m.mes)}</h2>
          <div className="mes-tags">
            {m.mes === hoy && <span className="tag t-acc">mes actual</span>}
            {m.esMesMeta && <span className="tag t-pos">🎯 mes de la meta</span>}
            {!m.hastaMeta && <span className="tag">después de la meta</span>}
            {m.aguinaldo > 0 && <span className="tag t-pos">+ aguinaldo</span>}
            {m.libre < 0 && <span className="tag t-neg">libre negativo</span>}
          </div>
        </div>
        <button className="nav-b" onClick={() => ir(1)} disabled={ix === meses.length - 1} aria-label="Mes siguiente">›</button>
      </div>

      <div className="prog">
        <div className="prog-h">
          <span>Progreso hacia la meta</span>
          <span className="prog-step">{m.hastaMeta ? `mes ${ix + 1} de ${nMeta}` : 'meta ya alcanzada en el plan'}</span>
        </div>
        <div className="prog-n">
          <div>
            <b className="num"><CountUp value={m.usdAcumulados} format={n => fmtUsd(n, 0)} ms={600} /></b>
            <span className="num"> de {fmtUsd(meta, 0)}</span>
          </div>
          <b className="prog-pct num"><CountUp value={(m.usdAcumulados / meta) * 100} format={n => `${Math.round(n)}%`} ms={600} /></b>
        </div>
        <div className="prog-bar" role="progressbar" aria-valuenow={Math.round(pDesp * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i className="pb-antes" style={{ width: `${pAntes * 100}%` }} />
          <i className="pb-mes" style={{ left: `${pAntes * 100}%`, width: `${Math.max(0, pDesp - pAntes) * 100}%` }} />
          {[0.25, 0.5, 0.75].map(t => <em key={t} style={{ left: `${t * 100}%` }} className={pDesp >= t ? 'past' : ''} />)}
        </div>
        <div className="prog-leg">
          <span><i className="lg-antes" />Ya tenías {fmtUsd(antes, 0)}</span>
          <span><i className="lg-mes" />Este mes +{fmtUsd(m.ahorroUsd, 0)}</span>
        </div>
        <div className={`prog-msg ${ok ? 'ok' : ''}`}>
          {ok
            ? <>🎯 Meta superada por <b className="num">{fmtUsd(m.usdAcumulados - meta, 0)}</b>{llega && llega.mes !== m.mes ? <> · la alcanzás en {mesLargo(llega.mes)}</> : null}</>
            : <>Te faltan <b className="num">{fmtUsd(meta - m.usdAcumulados, 0)}</b> ({fmtPct(1 - m.usdAcumulados / meta)}){llega ? <> · llegás en <b>{mesLargo(llega.mes)}</b></> : null}</>}
        </div>
      </div>
    </section>
  );
}
