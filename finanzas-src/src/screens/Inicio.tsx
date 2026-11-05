import { mesLargo, fmtArs } from '../../../lib/finanzas/format';
import { HabitosHoy } from '../components/HabitosHoy';
import { ComoVoy } from '../components/ComoVoy';
import { PagosMes } from '../components/PagosMes';
import { IcTipo } from '../components/QuickAdd';
import { ResumenSemana } from '../components/ResumenSemana';
import { MedioTag } from '../components/MedioTag';
import { useState } from 'react';
import { Ic } from '../components/Ic';
import { hoyMes, useAhorroReal, useCaja, usePlan, useStore } from '../store';

const diaCorto = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(d)}/${Number(m)}`; };

/** Pantalla de todos los días. Protagonista: el gasto del mes (cuánto llevás y cuánto te queda). La meta de ahorro vive en Plan. */
/** Lo que todavía falta mover este mes: cobrar y pagar. Lleva a donde se marca. */
function PendienteMes({ m }: { m: NonNullable<ReturnType<typeof usePlan>['meses'][number]> }) {
  const c = useCaja(m);
  if (c.faltaCobrar <= 0 && c.falta <= 0) return null;
  return (
    <a className="renglon-link" href="#/gastos">
      <span>Este mes: falta cobrar <b className="num">{fmtArs(c.faltaCobrar)}</b> · falta pagar <b className="num">{fmtArs(c.falta)}</b></span>
      <span className="mu">Marcar →</span>
    </a>
  );
}

export function Inicio() {
  const { gastos, checks, setMesSel, editarGasto, borrarGasto } = useStore();
  const [borrando, setBorrando] = useState<string | null>(null);
  const { meses, data } = usePlan();
  const { meta } = useAhorroReal();
  const mes = hoyMes();
  const planMes = meses.find(m => m.mes === mes);
  const recientes = [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 4);
  const proximo = meses.find(m => !checks[m.mes]);

  return (
    <div className="dash">
      <h1 className="vh">Inicio</h1>
      {data.ingresosFijos.length === 0 && (
        <a className="renglon-link" href="#/armar"><span><b>Armá tu mes</b> en 2 minutos: ingresos, fijos y cuotas.</span><span className="mu">Empezar →</span></a>
      )}
      <ComoVoy librePlan={planMes?.libre ?? null} />
      {planMes && <PendienteMes m={planMes} />}
      <HabitosHoy />

      <section className="bloque">
        <div className="bloque-h"><h2>Últimos gastos</h2><a className="b-txt" href="#/diario">Ver todos</a></div>
        {recientes.length === 0
          ? <p className="mu vacio">Todavía no cargaste nada. Tocá Cargar y anotá el primero.</p>
          : (
            <ul className="lista">
              {recientes.map(g => (
                <li key={g.id} className="gd">
                  <button className="gd-main" onClick={() => editarGasto(g)} aria-label={`Editar ${g.tipo}`}>
                    <IcTipo t={g.tipo} />
                    <span className="gd-t"><b>{g.tipo}</b><span><MedioTag medio={g.medio} /> <span className="mu">{diaCorto(g.fecha)}</span></span></span>
                    <b className="gd-v num">{fmtArs(g.monto)}</b>
                  </button>
                  {borrando === g.id ? (
                    <span className="gd-del" role="group" aria-label="¿Borrar este gasto?">
                      <button className="si" onClick={() => { borrarGasto(g.id); setBorrando(null); }}>Borrar</button>
                      <button onClick={() => setBorrando(null)}>No</button>
                    </span>
                  ) : <button className="icon-btn gd-x" onClick={() => setBorrando(g.id)} aria-label={`Borrar ${g.tipo}`}><Ic n="trash-2" size="s" /></button>}
                </li>
              ))}
            </ul>
          )}
      </section>

      <PagosMes />
      {proximo && meta > 0 && (
        <a className="renglon-link" href="#/mes" onClick={() => setMesSel(null)}>
          <span>{proximo.mes > mes ? 'Próximo mes del plan' : 'Pendiente'}: separar <b className="num">{fmtArs(proximo.ahorroPesos)}</b> en {mesLargo(proximo.mes)}</span>
          <span className="mu">Detalle →</span>
        </a>
      )}

      <ResumenSemana />
    </div>
  );
}
