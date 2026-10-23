import { gastosEstimados, totalGastosFijos, totalSuscripcionesPesos } from '../../../lib/finanzas/calc';
import { fmtArs, fmtUsd } from '../../../lib/finanzas/format';
import { nuevoId, usePlan, useStore } from '../store';
import { MoneyInput } from '../components/MoneyInput';
import { Borrar, TextoInline } from '../components/Campos';
import { CountUp } from '../components/CountUp';

export function Fijos() {
  const { editar } = useStore();
  const { data } = usePlan();
  const dolar = data.settings.dolar;
  const fijos = totalGastosFijos(data);
  const subs = totalSuscripcionesPesos(data);
  const total = gastosEstimados(data);
  const max = Math.max(1, ...data.gastosFijos.map(g => g.montoMensual), ...data.suscripciones.map(s => s.montoUsd * dolar));

  return (
    <div className="dash">
      <header className="ph"><div><h1>Gastos fijos</h1><p className="sub">Lo que pagás todos los meses</p></div></header>

      <section className="card ing-tot">
        <span className="eyebrow-d">Gastos estimados por mes</span>
        <b className="num"><CountUp value={total} format={fmtArs} ms={500} /></b>
        <div className="ing-mini two">
          <div><span>Fijos en pesos</span><b className="num">{fmtArs(fijos)}</b></div>
          <div><span>Suscripciones en USD</span><b className="num">{fmtArs(subs)}</b></div>
        </div>
      </section>

      <h3 className="sec">Gastos fijos</h3>
      <section className="card pad0">
        {data.gastosFijos.map(g => (
          <div key={g.id} className="ed-row bar-row">
            <div className="ed-main">
              <TextoInline value={g.concepto} ariaLabel="Concepto" onChange={v => editar(d => { d.gastosFijos.find(x => x.id === g.id)!.concepto = v; })} />
              <i className="mini-bar" style={{ width: `${(g.montoMensual / max) * 100}%` }} />
            </div>
            <MoneyInput value={g.montoMensual} ariaLabel={`Monto de ${g.concepto}`} onChange={n => editar(d => { d.gastosFijos.find(x => x.id === g.id)!.montoMensual = n; })} />
            <Borrar label={g.concepto} onConfirm={() => editar(d => { d.gastosFijos = d.gastosFijos.filter(x => x.id !== g.id); })} />
          </div>
        ))}
        <button className="ed-add" onClick={() => editar(d => { d.gastosFijos.push({ id: nuevoId(), concepto: 'Nuevo gasto', montoMensual: 0 }); })}>+ Agregar gasto fijo</button>
        <div className="ed-total"><span>Total gastos fijos</span><b className="num">{fmtArs(fijos)}</b></div>
      </section>

      <h3 className="sec">Suscripciones en dólares</h3>
      <section className="card pad0">
        {data.suscripciones.map(s => (
          <div key={s.id} className="ed-row bar-row">
            <div className="ed-main">
              <TextoInline value={s.concepto} ariaLabel="Concepto" onChange={v => editar(d => { d.suscripciones.find(x => x.id === s.id)!.concepto = v; })} />
              <small>= {fmtArs(s.montoUsd * dolar)} a dólar {fmtArs(dolar)}</small>
            </div>
            <MoneyInput value={s.montoUsd} prefijo="U$S" ariaLabel={`Dólares de ${s.concepto}`} onChange={n => editar(d => { d.suscripciones.find(x => x.id === s.id)!.montoUsd = n; })} />
            <Borrar label={s.concepto} onConfirm={() => editar(d => { d.suscripciones = d.suscripciones.filter(x => x.id !== s.id); })} />
          </div>
        ))}
        <button className="ed-add" onClick={() => editar(d => { d.suscripciones.push({ id: nuevoId(), concepto: 'Nueva suscripción', montoUsd: 0 }); })}>+ Agregar suscripción</button>
        <div className="ed-total"><span>Total suscripciones</span><b className="num">{fmtUsd(data.suscripciones.reduce((a, s) => a + s.montoUsd, 0))} · {fmtArs(subs)}</b></div>
      </section>
    </div>
  );
}
