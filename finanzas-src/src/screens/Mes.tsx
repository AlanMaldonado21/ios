import { mesActualDelPlan } from '../../../lib/finanzas/calc';
import { hoyMes, usePlan, useStore } from '../store';
import { Checklist } from '../components/Checklist';
import { fmtArs, fmtUsd } from '../../../lib/finanzas/format';
import { KpiCard } from '../components/KpiCard';
import { MesBox } from '../components/MesBox';
import { Apertura } from '../components/Apertura';
import { DonaChart, SERIES } from '../components/Charts';

export function Mes() {
  const { mesSel, setMesSel } = useStore();
  const { data, meses, resumen } = usePlan();
  const hoy = mesActualDelPlan(meses.map(m => m.mes), hoyMes());
  const sel = mesSel && meses.some(m => m.mes === mesSel) ? mesSel : hoy;
  const setSel = (m: string) => setMesSel(m);
  const ix = Math.max(0, meses.findIndex(m => m.mes === sel));
  const m = meses[ix], prev = ix > 0 ? meses[ix - 1] : null;
  const s = data.settings;
  const serie = (f: (x: typeof m) => number) => meses.map(f);
  const ir = (d: number) => setSel(meses[Math.min(meses.length - 1, Math.max(0, ix + d))].mes);

  return (
    <div className="dash">
      <header className="ph ph-sm">
        <div><h1>Detalle del mes</h1><p className="sub">Ahorro, reparto y apertura</p></div>
      </header>

      <div className="layout">
        <div className="col-mes">
          <MesBox m={m} ix={ix} meses={meses} meta={s.metaUsd} hoy={hoyMes()} ir={ir} base={resumen.ahorroActualUsd} />
          <div className="solo-mobile"><Checklist meses={meses} sel={sel} onSel={setSel} base={resumen.ahorroActualUsd} /></div>

          <section className="kpis">
            <KpiCard ico="🏦" label="Ahorro del mes" value={m.ahorroUsd} prev={prev?.ahorroUsd} format={n => fmtUsd(n, 0)}
              sub={fmtArs(m.ahorroPesos)} serie={serie(x => x.ahorroUsd)} activo={ix} />
            <KpiCard ico="🍔" label="Te queda libre" value={m.libre} prev={prev?.libre} format={fmtArs}
              sub="comida y salidas" serie={serie(x => x.libre)} activo={ix} tono={m.libre < 0 ? 'neg' : 'pos'} />
            <KpiCard ico="💵" label="Ingreso del mes" value={m.ingresoTotal} prev={prev?.ingresoTotal} format={fmtArs}
              sub={m.aguinaldo ? 'con aguinaldo' : `comisión ${fmtArs(m.comision)}`} serie={serie(x => x.ingresoTotal)} activo={ix} tono="c4" />
            <KpiCard ico="💳" label="Cuotas del mes" value={m.cuotas} prev={prev?.cuotas} format={fmtArs} invertir
              sub={m.cuotasDetalle.length ? `${m.cuotasDetalle.length} cuotas activas` : 'libre de cuotas'} serie={serie(x => x.cuotas)} activo={ix} tono="warn" />
          </section>

          <section className="card">
            <div className="reparto">
              <DonaChart label="Ingreso" centro={fmtArs(m.ingresoTotal)}
                partes={SERIES.map(x => ({ name: x.name, color: x.color, value: Math.max(0, Number(m[x.key])) }))} />
              <ul className="leg">
                {SERIES.map(x => {
                  const v = Number(m[x.key]);
                  return (
                    <li key={x.key}><i style={{ background: x.color }} /><span>{x.name}</span>
                      <b className={`num ${v < 0 ? 'neg' : ''}`}>{fmtArs(v)}</b><em className="num">{Math.round((v / m.ingresoTotal) * 100)}%</em></li>
                  );
                })}
              </ul>
            </div>
          </section>

          <h3 className="sec">Apertura del mes</h3>
          <section className="card pad0">
            <Apertura m={m} data={data} />
          </section>
        </div>

        <div className="col-plan">
          <div className="solo-desktop"><Checklist meses={meses} sel={sel} onSel={setSel} base={resumen.ahorroActualUsd} /></div>
        </div>
      </div>
    </div>
  );
}
