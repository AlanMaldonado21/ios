import { mesLargo, fmtArs } from '../../../lib/finanzas/format';
import { HabitosHoy } from '../components/HabitosHoy';
import { ComoVoy } from '../components/ComoVoy';
import { PagosMes } from '../components/PagosMes';
import { IcTipo } from '../components/QuickAdd';
import { MetaAhorro } from '../components/MetaAhorro';
import { ResumenSemana } from '../components/ResumenSemana';
import { MedioTag } from '../components/MedioTag';
import { hoyMes, useAhorroReal, usePlan, useStore } from '../store';

const diaCorto = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(d)}/${Number(m)}`; };

/** Pantalla de todos los días. Una cifra protagonista: lo ahorrado de verdad. El resto, debajo y más chico. */
export function Inicio() {
  const { gastos, checks, setMesSel, editarGasto } = useStore();
  const { data, meses } = usePlan();
  const { real, meta } = useAhorroReal();
  const mes = hoyMes();
  const planMes = meses.find(m => m.mes === mes);
  const recientes = [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 4);
  const proximo = meses.find(m => !checks[m.mes]);

  return (
    <div className="dash">
      <h1 className="vh">Inicio</h1>
      <MetaAhorro real={real} meta={meta} fecha={mesLargo(data.settings.fechaMeta)} />
      {proximo && meta > 0 && (
        <a className="renglon-link" href="#/mes" onClick={() => setMesSel(null)}>
          <span>{proximo.mes > mes ? 'Próximo mes del plan' : 'Pendiente'}: separar <b className="num">{fmtArs(proximo.ahorroPesos)}</b> en {mesLargo(proximo.mes)}</span>
          <span className="mu">Detalle →</span>
        </a>
      )}

      <ResumenSemana />
      <ComoVoy librePlan={planMes?.libre ?? null} />
      <HabitosHoy />

      <section className="bloque">
        <div className="bloque-h"><h2>Últimos gastos</h2><a className="b-txt" href="#/diario">Ver todos</a></div>
        {recientes.length === 0
          ? <p className="mu vacio">Todavía no cargaste nada. Tocá Cargar y anotá el primero.</p>
          : (
            <ul className="lista">
              {recientes.map(g => (
                <li key={g.id}>
                  <button className="gd-main" onClick={() => editarGasto(g)} aria-label={`Editar ${g.tipo}`}>
                    <IcTipo t={g.tipo} />
                    <span className="gd-t"><b>{g.tipo}</b><span><MedioTag medio={g.medio} /> <span className="mu">{diaCorto(g.fecha)}</span></span></span>
                    <b className="gd-v num">{fmtArs(g.monto)}</b>
                  </button>
                </li>
              ))}
            </ul>
          )}
      </section>

      <PagosMes />
    </div>
  );
}
