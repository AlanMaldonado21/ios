import { useState } from 'react';
import { mesActualDelPlan } from '../../../lib/finanzas/calc';
import { gastosAlContado, gastosDelMes, totalGastos } from '../../../lib/finanzas/diario';
import { fmtArs, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { hoyMes, usePlan, useStore } from '../store';
import { Fila } from './Apertura';
import { Ic } from './Ic';

/** Caja de cualquier mes del plan: lo que entra, lo que sale y lo que te queda. Plegada por defecto. */
export function PagosMes() {
  const { data, meses } = usePlan();
  const { gastos, topes } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [abierta, setAbierta] = useState(false);
  const [det, setDet] = useState(false);
  if (meses.length === 0) return null;
  const hoy = hoyMes();
  const ix = Math.max(0, meses.findIndex(m => m.mes === (sel ?? mesActualDelPlan(meses.map(x => x.mes), hoy))));
  const m = meses[ix];
  const dolar = data.settings.dolar;
  const ir = (d: number) => setSel(meses[Math.min(meses.length - 1, Math.max(0, ix + d))].mes);
  const gastado = totalGastos(gastosAlContado(gastosDelMes(gastos, m.mes)));
  const caja = (topes[m.mes] ?? m.libre) - gastado;
  const tag = m.mes === hoy ? 'mes en curso' : m.mes > hoy ? (ix === 0 ? 'el plan arranca acá' : 'más adelante') : 'ya pasó';

  return (
    <section className="bloque">
      <button className="plegable" onClick={() => setAbierta(a => !a)} aria-expanded={abierta}>
        <span><h2>Caja de {mesLargo(m.mes).split(' ')[0]}</h2><span className="mu t12">{tag}</span></span>
        <span className="num">{fmtArs(caja)}</span>
        <Ic n="chevron-down" className={abierta ? 'rot' : ''} />
      </button>
      {abierta && (
        <div className="plegable-b">
          <div className="mes-h">
            <button className="icon-btn" onClick={() => ir(-1)} disabled={ix === 0} aria-label="Mes anterior"><Ic n="chevron-left" /></button>
            <span className="mes-t"><b>{mesLargo(m.mes)}</b></span>
            <button className="icon-btn" onClick={() => ir(1)} disabled={ix === meses.length - 1} aria-label="Mes siguiente"><Ic n="chevron-right" /></button>
          </div>
          <Fila nombre="Ingresos" valor={`+ ${fmtArs(m.ingresoTotal)}`} />
          <Fila nombre="Ahorro" detalle={fmtUsd(m.ahorroUsd, 0)} valor={`− ${fmtArs(m.ahorroPesos)}`} />
          <Fila nombre="Cuotas" detalle={m.cuotasDetalle.length ? `${m.cuotasDetalle.length} activas` : 'sin cuotas'} valor={`− ${fmtArs(m.cuotas)}`} />
          <Fila nombre="Gastos fijos" valor={`− ${fmtArs(m.gastos)}`} />
          {gastado > 0 && <Fila nombre="Gastado al contado" valor={`− ${fmtArs(gastado)}`} />}
          <div className={`total ${caja < 0 ? 'neg' : ''}`}><span>Te queda de caja</span><b className="num">{fmtArs(caja)}</b></div>
          <button className="b-txt" onClick={() => setDet(d => !d)} aria-expanded={det}>{det ? 'Ocultar' : 'Ver'} qué pagás ese mes</button>
          {det && (
            <div>
              {m.cuotasDetalle.map(c => (
                <Fila key={c.id} nombre={c.concepto} tag={<span className="tag">{c.tarjeta.startsWith('BNA') ? 'BNA' : 'MP'}</span>}
                  detalle={c.numero === c.total ? 'última cuota' : `cuota ${c.numero} de ${c.total}`} valor={fmtArs(c.monto)} />
              ))}
              {data.gastosFijos.map(g => <Fila key={g.id} nombre={g.concepto} valor={fmtArs(g.montoMensual)} />)}
              {data.suscripciones.map(s => <Fila key={s.id} nombre={s.concepto} tag={<span className="tag">USD</span>} detalle={<>{fmtUsd(s.montoUsd)} × {fmtArs(dolar)}</>} valor={fmtArs(s.montoUsd * dolar)} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
