import type { MesCalc } from '../../../lib/finanzas/calc';
import { fmtPct, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { CountUp } from './CountUp';
import { useStore } from '../store';
import { ahorroReal } from '../../../lib/finanzas/diario';

/** Caja del mes: navegación + progreso hacia la meta al cierre de ese mes. */
export function MesBox({ m, ix, meses, meta, hoy, ir, base }: {
  m: MesCalc; ix: number; meses: MesCalc[]; meta: number; hoy: string; ir: (d: number) => void; base: number;
}) {
  const { checks } = useStore();
  // real = lo que tenías + meses tachados hasta este mes; pendiente = lo que falta separar hasta el cierre
  const { real, pendiente } = ahorroReal(base, meses, checks, m.mes);
  const cierre = real + pendiente;
  const pAntes = Math.min(1, real / meta);
  const pDesp = Math.min(1, cierre / meta);
  const ok = cierre >= meta;
  const nMeta = meses.filter(x => x.hastaMeta).length;
  // primer mes en que se llega a la meta
  const llega = meses.find(x => { const r = ahorroReal(base, meses, checks, x.mes); return r.real + r.pendiente >= meta; });
  return (
    <section className={`mesbox ${ok ? 'ok' : ''}`}>
      <div className="mes-h">
        <button className="nav-b" onClick={() => ir(-1)} disabled={ix === 0} aria-label="Mes anterior">‹</button>
        <div className="mes-t">
          <h2 key={m.mes}>{mesLargo(m.mes)}</h2>
          <div className="mes-tags">
            {m.mes === hoy ? <span className="tag t-acc">mes en curso</span> : ix === 0 && hoy < m.mes ? <span className="tag">el plan arranca acá · hoy es {mesLargo(hoy).split(' ')[0]}</span> : null}
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
          <span>Al cierre de {mesLargo(m.mes).split(' ')[0]}</span>
          <span className="prog-step">{m.hastaMeta ? `mes ${ix + 1} de ${nMeta}` : 'meta ya alcanzada en el plan'}</span>
        </div>
        <div className="prog-n">
          <div>
            <b className="num"><CountUp value={cierre} format={n => fmtUsd(n, 0)} ms={600} /></b>
            <span className="num"> de {fmtUsd(meta, 0)}</span>
          </div>
          <b className="prog-pct num" title="% de la meta"><CountUp value={(cierre / meta) * 100} format={n => `${Math.round(n)}%`} ms={600} /></b>
        </div>
        <p className={`prog-si ${pendiente === 0 ? 'ok' : ''}`}>
          {pendiente === 0 ? <>✓ Todo separado hasta {mesLargo(m.mes).split(' ')[0]}</> : <>si separás {fmtUsd(pendiente, 0)} {ix === 0 || pendiente === m.ahorroUsd ? 'de este mes' : 'que te faltan tachar'}</>}
        </p>
        <div className="prog-bar" role="progressbar" aria-valuenow={Math.round(pDesp * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i className="pb-antes" style={{ width: `${pAntes * 100}%` }} />
          <i className="pb-mes" style={{ left: `${pAntes * 100}%`, width: `${Math.max(0, pDesp - pAntes) * 100}%` }} />
          {[0.25, 0.5, 0.75].map(t => <em key={t} style={{ left: `${t * 100}%` }} className={pDesp >= t ? 'past' : ''} />)}
        </div>
        <div className="prog-leg">
          <span><i className="lg-antes" />Ahorrado {fmtUsd(real, 0)}</span>
          {pendiente > 0 && <span><i className="lg-mes" />Falta separar {fmtUsd(pendiente, 0)}</span>}
        </div>
        <div className={`prog-msg ${ok ? 'ok' : ''}`}>
          {ok
            ? <>🎯 Meta superada por <b className="num">{fmtUsd(cierre - meta, 0)}</b>{llega && llega.mes !== m.mes ? <> · la alcanzás en {mesLargo(llega.mes)}</> : null}</>
            : <>Te faltan <b className="num">{fmtUsd(meta - cierre, 0)}</b> ({fmtPct(1 - cierre / meta)}){llega ? <> · llegás en <b>{mesLargo(llega.mes)}</b></> : null}</>}
        </div>
      </div>
    </section>
  );
}
