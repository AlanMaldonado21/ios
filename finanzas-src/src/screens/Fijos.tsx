import { useState } from 'react';
import { gastosEstimados, totalGastosFijos, totalSuscripcionesPesos } from '../../../lib/finanzas/calc';
import { fmtArs, fmtUsd } from '../../../lib/finanzas/format';
import { nuevoId, usePlan, useStore } from '../store';
import { MoneyInput } from '../components/MoneyInput';
import { TextoInline } from '../components/Campos';
import { CountUp } from '../components/CountUp';
import { Campo, FilaEditable } from '../components/FilaEditable';
import { Ic } from '../components/Ic';

export function Fijos() {
  const { editar } = useStore();
  const { data } = usePlan();
  const [abierta, setAbierta] = useState<string | null>(null);
  const dolar = data.settings.dolar;
  const fijos = totalGastosFijos(data);
  const subs = totalSuscripcionesPesos(data);
  const total = gastosEstimados(data);

  return (
    <div className="dash">
      <header className="ph"><div><h1>Gastos fijos</h1><p className="sub">Lo que pagás todos los meses</p></div></header>

      <section className="protagonista">
        <span className="rotulo">Gastos estimados por mes</span>
        <b className="cifra"><CountUp value={total} format={fmtArs} ms={500} /></b>
        <dl className="mini">
          <div><dt>Fijos en pesos</dt><dd className="num">{fmtArs(fijos)}</dd></div>
          <div><dt>Suscripciones en USD</dt><dd className="num">{fmtArs(subs)}</dd></div>
        </dl>
      </section>

      <section className="bloque">
        <div className="bloque-h"><h2>Gastos fijos</h2><span className="mu t12">Tocá uno para editarlo</span></div>
        <ul className="lista">
          {data.gastosFijos.map(g => (
            <FilaEditable key={g.id} id={g.id} abierta={abierta} setAbierta={setAbierta} etiqueta={g.concepto}
              nombre={g.concepto || 'Sin nombre'} valor={fmtArs(g.montoMensual)}
              onBorrar={() => editar(d => { d.gastosFijos = d.gastosFijos.filter(x => x.id !== g.id); })}>
              <div className="editor">
                <Campo label="Nombre"><TextoInline value={g.concepto} ariaLabel="Nombre del gasto" onChange={v => editar(d => { d.gastosFijos.find(x => x.id === g.id)!.concepto = v; })} /></Campo>
                <Campo label="Por mes"><MoneyInput value={g.montoMensual} ariaLabel={`Monto de ${g.concepto}`} onChange={n => editar(d => { d.gastosFijos.find(x => x.id === g.id)!.montoMensual = n; })} /></Campo>
              </div>
            </FilaEditable>
          ))}
        </ul>
        <button className="b-txt agregar" onClick={() => { const id = nuevoId(); editar(d => { d.gastosFijos.push({ id, concepto: '', montoMensual: 0 }); }); setAbierta(id); }}><Ic n="plus" size="s" />Agregar gasto fijo</button>
        <div className="total"><span>Total gastos fijos</span><b className="num">{fmtArs(fijos)}</b></div>
      </section>

      <section className="bloque">
        <div className="bloque-h"><h2>Suscripciones en dólares</h2></div>
        <ul className="lista">
          {data.suscripciones.map(s => (
            <FilaEditable key={s.id} id={s.id} abierta={abierta} setAbierta={setAbierta} etiqueta={s.concepto}
              nombre={s.concepto || 'Sin nombre'} detalle={`${fmtUsd(s.montoUsd)} a dólar ${fmtArs(dolar)}`} valor={fmtArs(s.montoUsd * dolar)}
              onBorrar={() => editar(d => { d.suscripciones = d.suscripciones.filter(x => x.id !== s.id); })}>
              <div className="editor">
                <Campo label="Nombre"><TextoInline value={s.concepto} ariaLabel="Nombre de la suscripción" onChange={v => editar(d => { d.suscripciones.find(x => x.id === s.id)!.concepto = v; })} /></Campo>
                <Campo label="Dólares por mes"><MoneyInput value={s.montoUsd} prefijo="U$S" ariaLabel={`Dólares de ${s.concepto}`} onChange={n => editar(d => { d.suscripciones.find(x => x.id === s.id)!.montoUsd = n; })} /></Campo>
              </div>
            </FilaEditable>
          ))}
        </ul>
        <button className="b-txt agregar" onClick={() => { const id = nuevoId(); editar(d => { d.suscripciones.push({ id, concepto: '', montoUsd: 0 }); }); setAbierta(id); }}><Ic n="plus" size="s" />Agregar suscripción</button>
        <div className="total"><span>Total suscripciones</span><b className="num">{fmtUsd(data.suscripciones.reduce((a, s) => a + s.montoUsd, 0))} · {fmtArs(subs)}</b></div>
      </section>
    </div>
  );
}
