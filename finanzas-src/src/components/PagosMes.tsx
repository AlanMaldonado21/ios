import { useState } from 'react';
import { mesActualDelPlan } from '../../../lib/finanzas/calc';
import { gastosAlContado, gastosDelMes, totalGastos } from '../../../lib/finanzas/diario';
import { fmtArs, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { hoyMes, usePlan, useStore } from '../store';
import { Fila } from './Apertura';

/** Caja de cualquier mes del plan: lo que entra, lo que sale y lo que te queda. Los detalles de pagos van plegados. */
export function PagosMes() {
  const { data, meses } = usePlan();
  const { gastos, topes } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [det, setDet] = useState(false);
  if (meses.length === 0) return null;
  const hoy = hoyMes();
  const ix = Math.max(0, meses.findIndex(m => m.mes === (sel ?? mesActualDelPlan(meses.map(x => x.mes), hoy))));
  const m = meses[ix];
  const dolar = data.settings.dolar;
  const ir = (d: number) => setSel(meses[Math.min(meses.length - 1, Math.max(0, ix + d))].mes);
  const gastado = totalGastos(gastosAlContado(gastosDelMes(gastos, m.mes)));
  const caja = (topes[m.mes] ?? m.libre) - gastado;
  const tarjetas = [...new Set(m.cuotasDetalle.map(c => c.tarjeta))];

  return (
    <section className="card">
      <div className="mes-h">
        <button className="nav-b" onClick={() => ir(-1)} disabled={ix === 0} aria-label="Mes anterior">‹</button>
        <div className="mes-t">
          <span className="eyebrow-d">Caja de</span>
          <h2 key={m.mes}>{mesLargo(m.mes)}</h2>
          <div className="mes-tags">{m.mes === hoy ? <span className="tag t-acc">mes actual</span> : m.mes > hoy ? <span className="tag">próximo</span> : null}</div>
        </div>
        <button className="nav-b" onClick={() => ir(1)} disabled={ix === meses.length - 1} aria-label="Mes siguiente">›</button>
      </div>

      <div className={`libre ${caja < 0 ? 'neg' : ''}`} style={{ marginTop: 12 }}>
        <div><span className="libre-l">Te queda de caja</span><small>{gastado > 0 ? <>libre <span className="num">{fmtArs(topes[m.mes] ?? m.libre)}</span> − gastado <span className="num">{fmtArs(gastado)}</span></> : 'para comida y salidas'}</small></div>
        <b className="num">{fmtArs(caja)}</b>
      </div>

      <div style={{ marginTop: 8 }}>
        <Fila nombre="Ingresos" valor={`+ ${fmtArs(m.ingresoTotal)}`} />
        <Fila nombre="Ahorro" detalle={<span className="num">{fmtUsd(m.ahorroUsd, 0)}</span>} valor={`− ${fmtArs(m.ahorroPesos)}`} />
        <Fila nombre="Cuotas" detalle={m.cuotasDetalle.length ? `${m.cuotasDetalle.length} activas` : 'sin cuotas'} valor={`− ${fmtArs(m.cuotas)}`} />
        <Fila nombre="Gastos fijos" valor={`− ${fmtArs(m.gastos)}`} />
      </div>

      <button className="link" style={{ marginTop: 8 }} onClick={() => setDet(d => !d)} aria-expanded={det}>{det ? 'Ocultar' : 'Ver'} qué pagás ese mes {det ? '▴' : '▾'}</button>
      {det && (
        <div>
          {tarjetas.map(t => m.cuotasDetalle.filter(c => c.tarjeta === t).map(c => (
            <Fila key={c.id} nombre={c.concepto} tag={<span className="tag">{t}</span>}
              detalle={c.numero === c.total ? 'última cuota' : `cuota ${c.numero} de ${c.total}`} valor={fmtArs(c.monto)} />
          )))}
          {data.gastosFijos.map(g => <Fila key={g.id} nombre={g.concepto} valor={fmtArs(g.montoMensual)} />)}
          {data.suscripciones.map(s => <Fila key={s.id} nombre={s.concepto} tag={<span className="tag t-c4">USD</span>} detalle={<span className="num">{fmtUsd(s.montoUsd)} × {fmtArs(dolar)}</span>} valor={fmtArs(s.montoUsd * dolar)} />)}
        </div>
      )}
    </section>
  );
}
