import { useMemo, useState } from 'react';
import { calcularPlan, mesActualDelPlan } from '../../../lib/finanzas/calc';
import { SEED } from '../../../lib/finanzas/seed';
import { fmtArs, fmtPct, fmtUsd, mesCorto, mesLargo } from '../../../lib/finanzas/format';
import { ProgressRing } from '../components/ProgressRing';
import { KpiCard } from '../components/KpiCard';
import { CountUp } from '../components/CountUp';
import { MonthStrip } from '../components/MonthStrip';
import { MesBox } from '../components/MesBox';
import { Apertura } from '../components/Apertura';
import { AcumuladoChart, ApiladoChart, CuotasChart, DonaChart, SERIES, TARJETAS } from '../components/Charts';

const DOLARES = [1500, 1550, 1750];
const hoyMes = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

export function Dashboard() {
  // Maqueta: usa el seed en memoria. Después lee de Supabase.
  const [dolar, setDolar] = useState(SEED.settings.dolar);
  const data = useMemo(() => ({ ...SEED, settings: { ...SEED.settings, dolar } }), [dolar]);
  const { meses, resumen: r } = useMemo(() => calcularPlan(data), [data]);
  const hoy = mesActualDelPlan(meses.map(m => m.mes), hoyMes());
  const [sel, setSel] = useState(hoy);
  const ix = Math.max(0, meses.findIndex(m => m.mes === sel));
  const m = meses[ix], prev = ix > 0 ? meses[ix - 1] : null;
  const s = data.settings;
  const serie = (f: (x: typeof m) => number) => meses.map(f);
  const ir = (d: number) => setSel(meses[Math.min(meses.length - 1, Math.max(0, ix + d))].mes);

  return (
    <div className="dash">
      <header className="ph">
        <div>
          <h1>Finanzas</h1>
          <p className="sub">Ahorro en dólares</p>
        </div>
        <div className="seg" role="group" aria-label="Dólar estimado">
          <span className="seg-l">U$S</span>
          {DOLARES.map(d => (
            <button key={d} className={d === dolar ? 'on' : ''} onClick={() => setDolar(d)}>{d.toLocaleString('es-AR')}</button>
          ))}
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-top">
          <ProgressRing pct={r.usdProyectados / s.metaUsd} size={innerWidth >= 900 ? 150 : 96} stroke={innerWidth >= 900 ? 13 : 9} />
          <div className="hero-t">
            <span className="eyebrow">Proyectado a {mesCorto(s.fechaMeta)}</span>
            <div className="hero-n"><CountUp value={r.usdProyectados} format={n => fmtUsd(n, 0)} /></div>
            <div className="hero-s">meta <b className="num">{fmtUsd(s.metaUsd, 0)}</b> · {r.mesesHastaMeta} meses</div>
            <span className={`badge ${r.cumplida ? 'b-pos' : 'b-warn'}`}>
              {r.cumplida ? '✓ META CUMPLIDA' : `Te faltan ${fmtUsd(-r.diferencia, 0)}`}
            </span>
          </div>
        </div>
        <div className="hero-stats">
          <div><span>Ahorrado hoy</span><b className="num">{fmtUsd(r.ahorroActualUsd, 0)}</b></div>
          <div><span>{r.cumplida ? 'Te sobran' : 'Te faltan'}</span><b className={`num ${r.cumplida ? 'pos' : 'warn'}`}>{fmtUsd(Math.abs(r.diferencia), 0)}</b></div>
          <div><span>Ahorro necesario</span><b className="num">{fmtPct(r.pctNecesario)}</b><em>{r.lectura}</em></div>
        </div>
      </section>

      {/* MESES */}
      <MonthStrip meses={meses} sel={sel} onSel={setSel} hoy={hoy} meta={s.metaUsd} />

      <div className="layout">
        <div className="col-mes">
          <MesBox m={m} ix={ix} meses={meses} meta={s.metaUsd} hoy={hoy} ir={ir} />

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
          <h3 className="sec first">Todo el plan</h3>
          <section className="card">
            <div className="ch"><h2>Dólares acumulados</h2><span className="hint">Tocá un mes para abrirlo</span></div>
            <AcumuladoChart meses={meses} meta={s.metaUsd} fechaMeta={s.fechaMeta} sel={sel} onSel={setSel} />
          </section>
          <section className="card">
            <div className="ch"><h2>Reparto mes a mes</h2><span className="hint">Atenuado: después de la meta</span></div>
            <ul className="leg inline">{SERIES.map(x => <li key={x.key}><i style={{ background: x.color }} /><span>{x.name}</span></li>)}</ul>
            <ApiladoChart meses={meses} sel={sel} onSel={setSel} />
          </section>
          <section className="card">
            <div className="ch"><h2>Cuotas por mes</h2><span className="hint">Total que falta {fmtArs(r.totalCuotasPlan)}</span></div>
            <ul className="leg inline">{TARJETAS.map(t => <li key={t.key}><i style={{ background: t.color }} /><span>{t.key}</span></li>)}</ul>
            <CuotasChart meses={meses} sel={sel} onSel={setSel} />
            <p className="foot">Última cuota en <b>{mesLargo([...meses].reverse().find(x => x.cuotas > 0)?.mes ?? meses[0].mes)}</b></p>
          </section>
        </div>
      </div>
    </div>
  );
}
