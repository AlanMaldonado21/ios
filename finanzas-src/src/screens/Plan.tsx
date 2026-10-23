import { mesActualDelPlan } from '../../../lib/finanzas/calc';
import { fmtArs, fmtPct, fmtUsd, mesCorto, mesLargo } from '../../../lib/finanzas/format';
import { usePlan, useStore } from '../store';
import { ProgressRing } from '../components/ProgressRing';
import { CountUp } from '../components/CountUp';
import { MonthStrip } from '../components/MonthStrip';
import { AcumuladoChart, ApiladoChart, CuotasChart, SERIES, TARJETAS } from '../components/Charts';
import { hoyMes } from './Dashboard';
import { PlanTabla } from '../components/PlanTabla';
import { ahorroReal } from '../../../lib/finanzas/diario';

const DOLARES = [1500, 1550, 1750];

/** Vista general del plan: proyección a la meta, progreso por mes y gráficos. Tocar un mes lo abre en Inicio. */
export function Plan() {
  const { dolar, setDolar, checks, mesSel, setMesSel } = useStore();
  const { data, meses, resumen: r } = usePlan();
  const s = data.settings;
  const hoy = mesActualDelPlan(meses.map(m => m.mes), hoyMes());
  const sel = mesSel && meses.some(m => m.mes === mesSel) ? mesSel : hoy;
  const abrir = (m: string) => { setMesSel(m); location.hash = '#/inicio'; };
  const grande = typeof innerWidth === 'number' && innerWidth >= 900;

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
          <ProgressRing pct={r.usdProyectados / s.metaUsd} size={grande ? 150 : 96} stroke={grande ? 13 : 9} />
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
          <div><span>Ahorrado hoy</span><b className="num">{fmtUsd(ahorroReal(r.ahorroActualUsd, meses, checks).real, 0)}</b></div>
          <div><span>{r.cumplida ? 'Te sobran' : 'Te faltan'}</span><b className={`num ${r.cumplida ? 'pos' : 'warn'}`}>{fmtUsd(Math.abs(r.diferencia), 0)}</b></div>
          <div><span>Ahorro necesario</span><b className="num">{fmtPct(r.pctNecesario)}</b><em>{r.lectura}</em></div>
        </div>
      </section>

      <h3 className="sec">Tocá un mes para abrirlo</h3>
      <MonthStrip meses={meses} sel={sel} onSel={abrir} hoy={hoy} meta={s.metaUsd} checks={checks} />

      <h3 className="sec">Mes a mes</h3>
      <p className="ed-help" style={{ padding: '0 4px 10px' }}>Mové el % de ahorro de cada mes. "auto" usa el {fmtPct(r.pctNecesario)} que necesitás para llegar justo.</p>
      <PlanTabla meses={meses} abrir={abrir} />

      <h3 className="sec">Gráficos</h3>
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
