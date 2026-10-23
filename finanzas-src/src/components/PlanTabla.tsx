import type { MesCalc } from '../../../lib/finanzas/calc';
import { fmtArs, fmtPct, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { useStore } from '../store';

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Plan mes a mes: % de ahorro editable con slider. Sin % manual usa el automático. */
export function PlanTabla({ meses, abrir }: { meses: MesCalc[]; abrir: (m: string) => void }) {
  const { editar } = useStore();
  const setPct = (mes: string, pct: number | null) => editar(d => {
    const o = d.overrides.find(x => x.mes === mes);
    if (o) o.porcentajeManual = pct; else d.overrides.push({ mes, porcentajeManual: pct });
  });
  return (
    <section className="card pad0 pt">
      {meses.map(m => (
        <div key={m.mes} className={`pt-row ${m.hastaMeta ? '' : 'post'} ${m.libre < 0 ? 'neg' : ''}`}>
          <div className="pt-h">
            <button className="pt-m" onClick={() => abrir(m.mes)}>{cap(mesLargo(m.mes))}{m.esMesMeta ? ' 🎯' : ''}{m.aguinaldo ? <span className="tag t-pos">aguinaldo</span> : null}</button>
            <b className="pt-usd num">{fmtUsd(m.ahorroUsd, 0)}</b>
          </div>
          <div className="pt-s">
            <input type="range" min={0} max={100} step={1} value={Math.round(m.pct * 100)} aria-label={`% de ahorro de ${mesLargo(m.mes)}`}
              style={{ ['--p' as string]: `${Math.min(100, m.pct * 100)}%` }}
              onChange={e => setPct(m.mes, Number(e.target.value) / 100)} />
            <span className="pt-pct num">{fmtPct(m.pct)}</span>
            {m.pctManual != null
              ? <button className="pt-auto" onClick={() => setPct(m.mes, null)} title="Volver al automático">↺ auto</button>
              : <span className="pt-auto on">auto</span>}
          </div>
          <div className="pt-f">
            <span>Ahorro <b className="num">{fmtArs(m.ahorroPesos)}</b></span>
            <span>Cuotas <b className="num">{fmtArs(m.cuotas)}</b></span>
            <span>Libre <b className={`num ${m.libre < 0 ? 'neg' : 'pos'}`}>{fmtArs(m.libre)}</b></span>
          </div>
        </div>
      ))}
    </section>
  );
}
