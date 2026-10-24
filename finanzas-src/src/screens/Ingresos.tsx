import { useState } from 'react';
import { aguinaldoDelMes, comisionCobrada, facturacionDe, mesActualDelPlan, sumarMeses, totalFijos } from '../../../lib/finanzas/calc';
import { fmtArs, fmtPct, mesLargo } from '../../../lib/finanzas/format';
import { hoyMes, nuevoId, usePlan, useStore } from '../store';
import { MoneyInput } from '../components/MoneyInput';
import { CountUp } from '../components/CountUp';


export function Ingresos() {
  const { editar } = useStore();
  const { data, meses } = usePlan();
  const [borrar, setBorrar] = useState<string | null>(null);
  const mes = mesActualDelPlan(meses.map(m => m.mes), hoyMes());
  const comision = comisionCobrada(data, mes);
  const fijos = totalFijos(data);
  const base = data.ingresosFijos.find(i => i.esBaseAguinaldo);
  const aguinaldo = aguinaldoDelMes(data, `${mes.slice(0, 4)}-06`);
  // Meses de facturación: desde el mes anterior al plan hasta el final
  const mesesFact = Array.from({ length: data.settings.mesesPlan + 1 }, (_, i) => sumarMeses(data.settings.mesInicioPlan, i - 1));
  const totalFact = mesesFact.reduce((a, m) => a + facturacionDe(data, m), 0);

  const setFact = (m: string, monto: number) => editar(d => {
    const f = d.facturacion.find(x => x.mes === m);
    if (f) f.monto = monto; else d.facturacion.push({ mes: m, monto });
  });

  return (
    <div className="dash">
      <header className="ph">
        <div><h1>Ingresos</h1><p className="sub">Todo se recalcula al instante</p></div>
      </header>

      <section className="card ing-tot">
        <span className="eyebrow-d">Ingreso de {mesLargo(mes)}</span>
        <b className="num"><CountUp value={fijos + comision} format={fmtArs} ms={500} /></b>
        <div className="ing-mini">
          <div><span>Fijos</span><b className="num">{fmtArs(fijos)}</b></div>
          <div><span>Comisión</span><b className="num">{fmtArs(comision)}</b></div>
          <div><span>Aguinaldo</span><b className="num">{fmtArs(aguinaldo)}</b></div>
        </div>
      </section>

      <h3 className="sec">Ingresos mensuales fijos</h3>
      <section className="card pad0">
        {data.ingresosFijos.map(i => (
          <div key={i.id} className="ed-row">
            <div className="ed-main">
              <input className="ed-name" value={i.nombre} aria-label="Nombre de la fuente"
                onChange={e => editar(d => { d.ingresosFijos.find(x => x.id === i.id)!.nombre = e.target.value; })} />
              <button className={`ag-tog ${i.esBaseAguinaldo ? 'on' : ''}`}
                onClick={() => editar(d => { d.ingresosFijos.forEach(x => { x.esBaseAguinaldo = x.id === i.id ? !i.esBaseAguinaldo : false; }); })}>
                {i.esBaseAguinaldo ? '✓ base aguinaldo' : 'base aguinaldo'}
              </button>
            </div>
            <MoneyInput value={i.montoMensual} ariaLabel={`Monto de ${i.nombre}`}
              onChange={n => editar(d => { d.ingresosFijos.find(x => x.id === i.id)!.montoMensual = n; })} />
            {borrar === i.id
              ? <span className="gd-del"><button className="si" onClick={() => { editar(d => { d.ingresosFijos = d.ingresosFijos.filter(x => x.id !== i.id); }); setBorrar(null); }}>Borrar</button><button onClick={() => setBorrar(null)}>No</button></span>
              : <button className="gd-x" onClick={() => setBorrar(i.id)} aria-label={`Borrar ${i.nombre}`}>×</button>}
          </div>
        ))}
        <div className="ed-row ed-calc">
          <div className="ed-main"><b>Comisión por ventas</b><small>{fmtPct(data.comisionPct)} de lo facturado el mes anterior</small></div>
          <b className="num">{fmtArs(comision)}</b>
        </div>
        <button className="ed-add" onClick={() => editar(d => { d.ingresosFijos.push({ id: nuevoId(), nombre: 'Nueva fuente', montoMensual: 0, esBaseAguinaldo: false }); })}>+ Agregar fuente</button>
        <div className="ed-total"><span>Total ingreso mensual</span><b className="num">{fmtArs(fijos + comision)}</b></div>
      </section>

      <div className="ing-grid">
        <section className="card">
          <h2>Comisión por ventas</h2>
          <div className="ed-pct">
            <MoneyInput value={Math.round(data.comisionPct * 10000) / 100} prefijo="" sufijo="%" ariaLabel="Porcentaje de comisión"
              onChange={n => editar(d => { d.comisionPct = n / 100; })} />
            <small>Se cobra el mes siguiente a la facturación</small>
          </div>
        </section>
        <section className="card">
          <h2>Aguinaldo</h2>
          <div className="ed-ag"><b className="num">{fmtArs(aguinaldo)}</b>
            <small>{base ? `Mitad del sueldo de ${base.nombre} · junio y diciembre` : 'Marcá una fuente como base del aguinaldo'}</small></div>
        </section>
      </div>

      <h3 className="sec">Facturación Gimos proyectada</h3>
      <section className="card pad0">
        <p className="ed-help">Cargá lo que facturás cada mes. La comisión ({fmtPct(data.comisionPct)}) se cobra el mes siguiente.</p>
        <div className="fact-h"><span>Mes</span><span>Facturación</span><span>Comisión · se cobra en</span></div>
        {mesesFact.map(m => {
          const f = facturacionDe(data, m);
          const cobra = sumarMeses(m, 1);
          const enPlan = meses.some(x => x.mes === cobra);
          return (
            <div key={m} className={`fact-r ${enPlan ? '' : 'off'}`}>
              <span className="fact-m">{mesLargo(m)}</span>
              <MoneyInput value={f} ariaLabel={`Facturación de ${mesLargo(m)}`} onChange={n => setFact(m, n)} />
              <span className="fact-c"><b className="num">{fmtArs(f * data.comisionPct)}</b><small>{enPlan ? mesLargo(cobra) : 'fuera del plan'}</small></span>
            </div>
          );
        })}
        <div className="ed-total"><span>Total facturado</span><b className="num">{fmtArs(totalFact)}</b></div>
      </section>
    </div>
  );
}
