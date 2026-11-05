import { mesActualDelPlan } from '../../../lib/finanzas/calc';
import { fmtArs, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { kPago } from '../../../lib/finanzas/pagos';
import { hoyMes, usePlan, useStore } from '../store';
import { BotonCobro, CajaReal, Fila, PagarTarjetas } from './Apertura';

/** Lista de "qué pagué este mes" (gastos fijos y suscripciones, o cuotas) con casilla, más la caja real. */
export function PagosDelMes({ que, tarjeta }: { que: 'fijos' | 'cuotas'; tarjeta?: string }) {
  const { data, meses } = usePlan();
  const { pagos, togglePago } = useStore();
  if (meses.length === 0) return null;
  const m = meses.find(x => x.mes === mesActualDelPlan(meses.map(y => y.mes), hoyMes())) ?? meses[0];
  const dolar = data.settings.dolar;
  const ck = (t: 'f' | 's' | 'c', id: string, nombre: string) => { const k = kPago(m.mes, t, id); return { on: !!pagos[k], onToggle: () => togglePago(k), nombre }; };
  const filas = que === 'fijos'
    ? [
        ...data.gastosFijos.map(g => <Fila key={g.id} nombre={g.concepto || 'Sin nombre'} valor={fmtArs(g.montoMensual)} check={ck('f', g.id, g.concepto)} />),
        ...data.suscripciones.map(s => <Fila key={s.id} nombre={s.concepto || 'Sin nombre'} tag={<span className="tag t-c4">USD</span>} detalle={`${fmtUsd(s.montoUsd)} × ${fmtArs(dolar)}`} valor={fmtArs(s.montoUsd * dolar)} check={ck('s', s.id, s.concepto)} />),
      ]
    : m.cuotasDetalle.filter(c => !tarjeta || c.tarjeta === tarjeta).map(c => <Fila key={c.id} nombre={c.concepto} detalle={c.numero === c.total ? 'última cuota' : `cuota ${c.numero} de ${c.total}`} valor={fmtArs(c.monto)} check={ck('c', c.id, c.concepto)} />);

  return (
    <section className="bloque">
      <div className="bloque-h"><h2>Pagos de {mesLargo(m.mes)}</h2><span className="mu t12">Tildá lo que ya pagaste</span></div>
      {filas.length === 0 ? <p className="mu vacio">Este mes no tenés nada para pagar acá.</p> : <div className="pagos-l">{filas}</div>}
      <PagarTarjetas m={m} solo={tarjeta} />
      {!tarjeta && <BotonCobro m={m} />}
      {!tarjeta && <CajaReal m={m} />}
    </section>
  );
}
