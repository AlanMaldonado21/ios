import { useState } from 'react';
import { aguinaldoDelMes, comisionCobrada, facturacionDe, mesActualDelPlan, sumarMeses, totalFijos } from '../../../lib/finanzas/calc';
import { fmtArs, fmtPct, mesLargo } from '../../../lib/finanzas/format';
import { hoyMes, nuevoId, usePlan, useStore } from '../store';
import { MoneyInput } from '../components/MoneyInput';
import { TextoInline } from '../components/Campos';
import { CountUp } from '../components/CountUp';
import { Campo, FilaEditable } from '../components/FilaEditable';
import { Ic } from '../components/Ic';

export function Ingresos() {
  const { editar } = useStore();
  const { data, meses } = usePlan();
  const [abierta, setAbierta] = useState<string | null>(null);
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
      <header className="ph"><div><h1>Ingresos</h1><p className="sub">Todo se recalcula al instante</p></div></header>

      <section className="protagonista">
        <span className="rotulo">Ingreso de {mesLargo(mes)}</span>
        <b className="cifra"><CountUp value={fijos + comision} format={fmtArs} ms={500} /></b>
        <dl className="mini">
          <div><dt>Fijos</dt><dd className="num">{fmtArs(fijos)}</dd></div>
          <div><dt>Comisión</dt><dd className="num">{fmtArs(comision)}</dd></div>
          <div><dt>Aguinaldo (jun/dic)</dt><dd className="num">{fmtArs(aguinaldo)}</dd></div>
        </dl>
      </section>

      <section className="bloque">
        <div className="bloque-h"><h2>Ingresos mensuales fijos</h2><span className="mu t12">Tocá uno para editarlo</span></div>
        <ul className="lista">
          {data.ingresosFijos.map(i => (
            <FilaEditable key={i.id} id={i.id} abierta={abierta} setAbierta={setAbierta} etiqueta={i.nombre}
              nombre={i.nombre || 'Sin nombre'} detalle={i.esBaseAguinaldo ? 'base del aguinaldo' : undefined} valor={fmtArs(i.montoMensual)}
              onBorrar={() => editar(d => { d.ingresosFijos = d.ingresosFijos.filter(x => x.id !== i.id); })}>
              <div className="editor">
                <Campo label="Nombre"><TextoInline value={i.nombre} ariaLabel="Nombre de la fuente" onChange={v => editar(d => { d.ingresosFijos.find(x => x.id === i.id)!.nombre = v; })} /></Campo>
                <Campo label="Por mes"><MoneyInput value={i.montoMensual} ariaLabel={`Monto de ${i.nombre}`} onChange={n => editar(d => { d.ingresosFijos.find(x => x.id === i.id)!.montoMensual = n; })} /></Campo>
                <label className="check-row"><input type="checkbox" checked={i.esBaseAguinaldo}
                  onChange={() => editar(d => { d.ingresosFijos.forEach(x => { x.esBaseAguinaldo = x.id === i.id ? !i.esBaseAguinaldo : false; }); })} />
                  Es la base del aguinaldo (mitad en junio y diciembre)</label>
              </div>
            </FilaEditable>
          ))}
        </ul>
        <button className="b-txt agregar" onClick={() => { const id = nuevoId(); editar(d => { d.ingresosFijos.push({ id, nombre: '', montoMensual: 0, esBaseAguinaldo: false }); }); setAbierta(id); }}><Ic n="plus" size="s" />Agregar fuente</button>
        <div className="renglon"><span>Comisión por ventas <span className="mu t12">{fmtPct(data.comisionPct)} de lo facturado el mes anterior</span></span><b className="num">{fmtArs(comision)}</b></div>
        <div className="total"><span>Total ingreso mensual</span><b className="num">{fmtArs(fijos + comision)}</b></div>
      </section>

      <section className="bloque">
        <div className="bloque-h"><h2>Comisión y aguinaldo</h2></div>
        <div className="editor">
          <Campo label="Comisión (%)"><MoneyInput value={Math.round(data.comisionPct * 10000) / 100} prefijo="" sufijo="%" ariaLabel="Porcentaje de comisión" onChange={n => editar(d => { d.comisionPct = n / 100; })} /></Campo>
          <p className="mu t12">Se cobra el mes siguiente a la facturación. Aguinaldo: {base ? `mitad del sueldo de ${base.nombre}, junio y diciembre (${fmtArs(aguinaldo)})` : 'marcá una fuente como base del aguinaldo'}.</p>
        </div>
      </section>

      <details className="bloque plegado">
        <summary><h2>Facturación proyectada</h2><span className="mu t12">{mesesFact.length} meses · total {fmtArs(totalFact)}</span></summary>
        <p className="mu t12">Cargá lo que facturás cada mes. La comisión ({fmtPct(data.comisionPct)}) se cobra el mes siguiente.</p>
        <div className="tabla">
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
        </div>
      </details>
    </div>
  );
}
