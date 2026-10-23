import { useMemo, useState } from 'react';
import { fmtArs, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { ProgressRing } from '../components/ProgressRing';
import { KpiCard } from '../components/KpiCard';
import { CountUp } from '../components/CountUp';
import { AcumuladoChart, ApiladoChart, CuotasChart, DonaChart, SERIES } from '../components/Charts';
import { mockPlan, mockResumen } from '../mock';

const DOLARES = [1500, 1550, 1750];

export function Dashboard() {
  const [dolar, setDolar] = useState(mockResumen.dolar);
  // Maqueta: recalcula los USD con el dólar elegido.
  const plan = useMemo(() => {
    let acum = 1050 + 1627500 / dolar;
    return mockPlan.map(m => { const u = m.ahorroPesos / dolar; acum += u; return { ...m, ahorroUsd: u, usdAcum: acum }; });
  }, [dolar]);
  const { meta, fechaMeta } = mockResumen;
  const proyectados = plan.filter(m => m.mes <= fechaMeta).at(-1)!.usdAcum;
  const pct = proyectados / meta;
  const ok = proyectados >= meta;
  const ix = plan.findIndex(m => m.mes === mockResumen.mesActual);
  const cur = plan[ix], prev = plan[ix - 1];
  const serie = (k: keyof (typeof plan)[0]) => plan.filter(m => !m.postMeta).map(m => Number(m[k]));
  const ingresoTotal = cur.ingreso + cur.aguinaldo;

  return (
    <div className="dash">
      <header className="ph">
        <div>
          <h1>Finanzas</h1>
          <p className="sub">Plan de ahorro en dólares · meta {mesLargo(fechaMeta)}</p>
        </div>
        <div className="seg" role="group" aria-label="Dólar estimado">
          {DOLARES.map(d => (
            <button key={d} className={d === dolar ? 'on' : ''} onClick={() => setDolar(d)}>$ {d.toLocaleString('es-AR')}</button>
          ))}
        </div>
      </header>

      <section className="hero card glow">
        <ProgressRing pct={pct} />
        <div className="hero-t">
          <span className="eyebrow">USD proyectados a {mesLargo(fechaMeta)}</span>
          <div className="hero-n"><CountUp value={proyectados} format={n => fmtUsd(n, 0)} /></div>
          <div className="hero-s">de <b className="num">{fmtUsd(meta, 0)}</b></div>
          <span className={`badge ${ok ? 'b-pos' : 'b-warn'}`}>
            {ok ? '✓ META CUMPLIDA' : `Te faltan ${fmtUsd(meta - proyectados, 0)}`}
          </span>
          {ok && <p className="hero-x">Te sobran <b className="num">{fmtUsd(proyectados - meta, 0)}</b> sobre la meta</p>}
        </div>
      </section>

      <h3 className="sec">{mesLargo(cur.mes)}</h3>
      <section className="kpis">
        <KpiCard label="Ahorro del mes" value={cur.ahorroUsd} prev={prev?.ahorroUsd} format={n => fmtUsd(n, 0)} serie={serie('ahorroUsd')} />
        <KpiCard label="Te queda libre" value={cur.libre} prev={prev?.libre} format={fmtArs} serie={serie('libre')} tono={cur.libre < 0 ? 'neg' : 'pos'} />
        <KpiCard label="Ingreso del mes" value={ingresoTotal} prev={prev ? prev.ingreso + prev.aguinaldo : null} format={fmtArs} serie={plan.filter(m => !m.postMeta).map(m => m.ingreso + m.aguinaldo)} tono="c4" />
        <KpiCard label="Cuotas del mes" value={cur.cuotas} prev={prev?.cuotas} format={fmtArs} serie={serie('cuotas')} tono="warn" invertir />
        <KpiCard label="USD acumulados" value={cur.usdAcum} prev={prev?.usdAcum} format={n => fmtUsd(n, 0)} serie={serie('usdAcum')} />
      </section>

      <div className="grid2">
        <section className="card span2">
          <div className="ch"><h2>Dólares acumulados</h2><span className="hint">Línea punteada: meta</span></div>
          <AcumuladoChart data={plan} meta={meta} fechaMeta={fechaMeta} />
        </section>

        <section className="card">
          <div className="ch"><h2>En qué se va el ingreso</h2><span className="hint">{mesLargo(cur.mes)}</span></div>
          <DonaChart centro={fmtArs(ingresoTotal)} partes={SERIES.map(s => ({ name: s.name, color: s.color, value: Math.max(0, Number(cur[s.key])) }))} />
          <ul className="leg">
            {SERIES.map(s => {
              const v = Number(cur[s.key]);
              return (
                <li key={s.key}><i style={{ background: s.color }} /><span>{s.name}</span>
                  <b className={`num ${v < 0 ? 't-neg-x' : ''}`}>{fmtArs(v)}</b><em className="num">{Math.round((v / ingresoTotal) * 100)}%</em></li>
              );
            })}
          </ul>
        </section>

        <section className="card cuo">
          <div className="ch"><h2>Cuotas por mes</h2><span className="hint">Cuándo te las sacás de encima</span></div>
          <CuotasChart data={plan} />
          <p className="foot">Última cuota en <b>marzo 2027</b> · después, {fmtArs(0)} por mes</p>
        </section>

        <section className="card span2">
          <div className="ch"><h2>Mes a mes</h2><span className="hint">Meses después de la meta, atenuados</span></div>
          <ul className="leg inline">{SERIES.map(s => <li key={s.key}><i style={{ background: s.color }} /><span>{s.name}</span></li>)}</ul>
          <ApiladoChart data={plan} />
        </section>
      </div>
    </div>
  );
}
