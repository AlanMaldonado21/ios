import { mesActualDelPlan, type MesCalc } from '../../../lib/finanzas/calc';
import { fmtArs, mesLargo } from '../../../lib/finanzas/format';
import { fuentesDeCobro } from '../../../lib/finanzas/pagos';
import { hoyMes, usePlan } from '../store';
import { BotonCobro, Fila, useCobroCheck } from './Apertura';

/** Mes en curso del plan (o el primero). */
export function useMesActual(): MesCalc | null {
  const { meses } = usePlan();
  if (meses.length === 0) return null;
  return meses.find(x => x.mes === mesActualDelPlan(meses.map(y => y.mes), hoyMes())) ?? meses[0];
}

/** "¿Ya cobré?" por cada fuente de ingreso del mes. */
export function CobrosDelMes() {
  const m = useMesActual();
  return m ? <Cobros m={m} /> : null;
}

function Cobros({ m }: { m: MesCalc }) {
  const { data } = usePlan();
  const ci = useCobroCheck(m);
  return (
    <section className="bloque">
      <div className="bloque-h"><h2>Cobros de {mesLargo(m.mes)}</h2><span className="mu t12">Tildá lo que ya cobraste</span></div>
      <div className="pagos-l">
        {fuentesDeCobro(m, data).map(f => <Fila key={f.clave} nombre={f.nombre} valor={fmtArs(f.monto)} check={ci(f.clave, f.nombre)} />)}
      </div>
      <BotonCobro m={m} />
    </section>
  );
}
