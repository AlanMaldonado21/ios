import { useState } from 'react';
import { mesActualDelPlan } from '../../../lib/finanzas/calc';
import { fmtArs, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { hoyMes, usePlan } from '../store';
import { Fila } from './Apertura';

/** "Qué tenés que pagar": cuotas y gastos fijos de cualquier mes del plan, con flechas para cambiar de mes. */
export function PagosMes() {
  const { data, meses } = usePlan();
  const [sel, setSel] = useState<string | null>(null);
  if (meses.length === 0) return null;
  const actual = mesActualDelPlan(meses.map(m => m.mes), hoyMes());
  const ix = Math.max(0, meses.findIndex(m => m.mes === (sel ?? actual)));
  const m = meses[ix];
  const dolar = data.settings.dolar;
  const ir = (d: number) => setSel(meses[Math.min(meses.length - 1, Math.max(0, ix + d))].mes);
  const total = m.cuotas + m.gastos;
  const tarjetas = [...new Set(m.cuotasDetalle.map(c => c.tarjeta))];

  return (
    <section className="card">
      <div className="mes-h">
        <button className="nav-b" onClick={() => ir(-1)} disabled={ix === 0} aria-label="Mes anterior">‹</button>
        <div className="mes-t">
          <span className="eyebrow-d">Qué tenés que pagar</span>
          <h2 key={m.mes}>{mesLargo(m.mes)}</h2>
          <div className="mes-tags">{m.mes === actual && <span className="tag t-acc">mes actual</span>}</div>
        </div>
        <button className="nav-b" onClick={() => ir(1)} disabled={ix === meses.length - 1} aria-label="Mes siguiente">›</button>
      </div>

      <div className="libre" style={{ marginTop: 12 }}>
        <div><span className="libre-l">Total a pagar</span><small>cuotas + gastos fijos</small></div>
        <b className="num">{fmtArs(total)}</b>
      </div>

      <h3 className="sec">Cuotas · {fmtArs(m.cuotas)}</h3>
      {m.cuotasDetalle.length === 0 && <p className="vacio">Este mes no pagás ninguna cuota.</p>}
      {tarjetas.map(t => (
        <div key={t}>
          {m.cuotasDetalle.filter(c => c.tarjeta === t).map(c => (
            <Fila key={c.id} nombre={c.concepto} tag={<span className="tag">{t}</span>}
              detalle={c.numero === c.total ? 'última cuota' : `cuota ${c.numero} de ${c.total}`} valor={fmtArs(c.monto)} />
          ))}
        </div>
      ))}

      <h3 className="sec">Gastos fijos · {fmtArs(m.gastos)}</h3>
      {data.gastosFijos.map(g => <Fila key={g.id} nombre={g.concepto} valor={fmtArs(g.montoMensual)} />)}
      {data.suscripciones.map(s => <Fila key={s.id} nombre={s.concepto} tag={<span className="tag t-c4">USD</span>} detalle={`${fmtUsd(s.montoUsd)} × ${fmtArs(dolar)}`} valor={fmtArs(s.montoUsd * dolar)} />)}

      <p className="hint" style={{ marginTop: 10 }}>Además separás {fmtUsd(m.ahorroUsd, 0)} de ahorro y te quedan {fmtArs(m.libre)} libres. <a href="#/mes" onClick={() => undefined}>Ver detalle →</a></p>
    </section>
  );
}
