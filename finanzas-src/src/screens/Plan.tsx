import { mesActualDelPlan } from '../../../lib/finanzas/calc';
import { fmtArs, fmtPct, fmtUsd, mesCorto, mesLargo } from '../../../lib/finanzas/format';
import { hoyMes, usePlan, useStore } from '../store';
import { ProgressRing } from '../components/ProgressRing';
import { CountUp } from '../components/CountUp';
import { MonthStrip } from '../components/MonthStrip';
import { AcumuladoChart, ApiladoChart, CuotasChart, SERIES, TARJETAS } from '../components/Charts';
import { PlanTabla } from '../components/PlanTabla';
import { ahorroReal } from '../../../lib/finanzas/diario';

const DOLARES = [1500, 1550, 1750];

/** Vista general del plan: proyección a la meta, progreso por mes y gráficos. Tocar un mes lo abre en Detalle del mes. */
export function Plan() {
  const { dolar, setDolar, checks, mesSel, setMesSel } = useStore();
  const { data, meses, resumen: r } = usePlan();
  const s = data.settings;
  const hoy = mesActualDelPlan(meses.map(m => m.mes), hoyMes());
  const sel = mesSel && meses.some(m => m.mes === mesSel) ? mesSel : hoy;
  const abrir = (m: string) => { setMesSel(m); location.hash = '#/mes'; };
  const grande = typeof innerWidth === 'number' && innerWidth >= 900;
  const meta = s.metaUsd;
  const real = ahorroReal(r.ahorroActualUsd, meses, checks).real;
  const cumplidaReal = meta > 0 && real >= meta;

  return (
    <div className="dash">
      <header className="ph">
        <div><h1>Plan</h1><p className="sub">Proyección a la meta</p></div>
        <div className="seg" role="group" aria-label="Dólar estimado">
          <span className="seg-l">U$S</span>
          {DOLARES.map(d => (
            <button key={d} className={d === dolar ? 'on' : ''} onClick={() => setDolar(d)}>{d.toLocaleString('es-AR')}</button>
          ))}
        </div>
      </header>

      <section className="hero">
        <div className="hero-top">
          <ProgressRing pct={meta ? real / meta : 0} proy={meta ? r.usdProyectados / meta : 0} size={grande ? 150 : 96} stroke={grande ? 13 : 9} />
          <div className="hero-t">
            <span className="eyebrow">Ahorrado de verdad</span>
            <div className="hero-n"><CountUp value={real} format={n => fmtUsd(n, 0)} /></div>
            <div className="hero-s">de <b className="num">{fmtUsd(meta, 0)}</b> · meta en {mesLargo(s.fechaMeta)}</div>
            {cumplidaReal
              ? <span className="badge b-pos">Meta cumplida</span>
              : <span className="badge b-warn">Faltan {fmtUsd(Math.max(0, meta - real), 0)}</span>}
          </div>
        </div>
        <div className="hero-stats">
          <div><span>Proyección a {mesCorto(s.fechaMeta)}</span><b className="num">{fmtUsd(r.usdProyectados, 0)}</b><em>si separás lo del plan</em></div>
          <div><span>{r.cumplida ? 'La proyección sobra' : 'A la proyección le faltan'}</span><b className={`num ${r.cumplida ? 'pos' : 'warn'}`}>{fmtUsd(Math.abs(r.diferencia), 0)}</b></div>
          <div><span>Ahorro necesario</span><b className="num">{fmtPct(r.pctNecesario)}</b><em>{r.lectura}</em></div>
        </div>
        <p className="hero-leg"><i className="lg-real" />ahorrado <i className="lg-proy" />proyección (todavía no es plata separada)</p>
      </section>

      <h2 className="sec">Meses · tocá uno para abrirlo</h2>
      <MonthStrip meses={meses} sel={sel} onSel={abrir} hoy={hoy} meta={s.metaUsd} checks={checks} />

      <details className="bloque plegado">
        <summary><h2>Mes a mes</h2><span className="mu t12">% de ahorro de cada mes</span></summary>
        <p className="mu t12">Mové el % de ahorro de cada mes. "auto" usa el {fmtPct(r.pctNecesario)} que necesitás para llegar justo.</p>
        <PlanTabla meses={meses} abrir={abrir} />
      </details>

      <h2 className="sec">Gráficos</h2>
      <div className="grid-plan">
        <section className="card span2">
          <div className="ch"><h2>Dólares acumulados</h2><span className="hint">Línea punteada: meta</span></div>
          <AcumuladoChart meses={meses} meta={s.metaUsd} fechaMeta={s.fechaMeta} sel={sel} onSel={abrir} />
        </section>
        <section className="card">
          <div className="ch"><h2>Reparto mes a mes</h2><span className="hint">Atenuado: después de la meta</span></div>
          <ul className="leg inline">{SERIES.map(x => <li key={x.key}><i style={{ background: x.color }} /><span>{x.name}</span></li>)}</ul>
          <ApiladoChart meses={meses} sel={sel} onSel={abrir} />
        </section>
        <section className="card">
          <div className="ch"><h2>Cuotas por mes</h2><span className="hint">Total que falta {fmtArs(r.totalCuotasPlan)}</span></div>
          <ul className="leg inline">{TARJETAS.map(t => <li key={t.key}><i style={{ background: t.color }} /><span>{t.key}</span></li>)}</ul>
          <CuotasChart meses={meses} sel={sel} onSel={abrir} />
          <p className="foot">Última cuota en <b>{mesLargo([...meses].reverse().find(x => x.cuotas > 0)?.mes ?? meses[0].mes)}</b></p>
        </section>
      </div>
    </div>
  );
}
