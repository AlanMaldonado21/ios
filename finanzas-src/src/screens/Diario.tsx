import { useMemo, useState } from 'react';
import { sumarMeses } from '../../../lib/finanzas/calc';
import { MEDIOS, TARJETAS, acumuladoDiario, agruparPorDia, gastosAlContado, gastosDelMes, primerPagoCredito, primerRegistro, totalGastos, totalPorMedio, totalPorTipo } from '../../../lib/finanzas/diario';
import { fmtArs, mesCorto, mesLargo } from '../../../lib/finanzas/format';
import { hoyISO, usePlan, useStore } from '../store';
import { CountUp } from '../components/CountUp';
import { RitmoChart } from '../components/Charts';
import { IcTipo } from '../components/QuickAdd';
import { Ic } from '../components/Ic';
import { MedioTag } from '../components/MedioTag';
import { cerroDentroDelTope } from '../components/ComoVoy';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function etiquetaDia(iso: string) {
  const hoy = hoyISO();
  const [y, m, d] = iso.split('-').map(Number);
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
  const ayerISO = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(ayer.getDate()).padStart(2, '0')}`;
  if (iso === hoy) return 'Hoy';
  if (iso === ayerISO) return 'Ayer';
  return `${DIAS[new Date(y, m - 1, d).getDay()]} ${d} ${MESES[m - 1]}`;
}

/** Racha de registro: días seguidos en que cargaste algo (un gasto o "no gasté"). No premia gastar ni no gastar. */
function Registro() {
  const { gastos, sinGasto, toggleSinGasto } = useStore();
  const hoy = hoyISO();
  const r = window.Comun?.rachaRegistro({ gastos, sinGasto }) ?? { dias: 0, hoy: false };
  const conGastoHoy = gastos.some(g => g.fecha === hoy);
  const marcadoHoy = sinGasto.includes(hoy);
  return (
    <div className="registro">
      <p>{r.dias > 0 ? <>Registraste <b className="num">{r.dias}</b> {r.dias === 1 ? 'día' : 'días'} seguidos.</> : 'Sin racha de registro todavía.'}
        {!r.hoy && r.dias > 0 ? <span className="mu"> Hoy falta cargar.</span> : null}</p>
      {!conGastoHoy && (
        <button className={marcadoHoy ? 'b-sec on' : 'b-sec'} aria-pressed={marcadoHoy} onClick={() => { toggleSinGasto(hoy); window.Comun?.haptic(10); }}>
          {marcadoHoy ? <><Ic n="check" size="s" />Hoy sin gastos</> : 'Hoy no gasté'}
        </button>
      )}
    </div>
  );
}

export function Diario() {
  const { gastos, topes, borrarGasto, editarGasto, sinGasto } = useStore();
  const { meses } = usePlan();
  const [mes, setMes] = useState(hoyISO().slice(0, 7));
  const [borrando, setBorrando] = useState<string | null>(null);

  const delMes = useMemo(() => gastosDelMes(gastos, mes), [gastos, mes]);
  const contado = gastosAlContado(delMes);
  const total = totalGastos(contado);
  const enCredito = totalGastos(delMes) - total;
  const porMedio = totalPorMedio(delMes);
  const porTipo = totalPorTipo(delMes);
  const dias = agruparPorDia(delMes);
  const plan = meses.find(m => m.mes === mes);
  const libre = topes[mes] ?? (plan ? plan.libre : null);
  const usado = libre && libre > 0 ? total / libre : 0;
  const nivel = usado > 1 ? 'neg' : usado > 0.8 ? 'warn' : 'pos';
  const hoyM = hoyISO().slice(0, 7), hoyD = Number(hoyISO().slice(8));
  const cerro = mes < hoyM ? cerroDentroDelTope(gastos, topes, mes) : null;
  const sinGastoMes = sinGasto.filter(d => d.slice(0, 7) === mes && !delMes.some(g => g.fecha === d));

  const grafico = (() => {
    if (mes > hoyM) return null;
    const desde = primerRegistro(gastos, sinGasto);
    const puntos = acumuladoDiario(gastos, mes, mes === hoyM ? hoyD : 31, libre, desde);
    if (puntos.every(p => p.sinDatos)) return null;
    const sd = puntos.filter(p => p.sinDatos).length;
    return (
      <div className="gs-graf">
        <RitmoChart puntos={puntos} hoy={mes === hoyM ? hoyD : 0} />
        <p className="mu t12">{sd > 0 ? `Días 1 a ${sd}: sin datos, todavía no registrabas. ` : ''}{libre != null ? 'Punteada: el ritmo para llegar justo al tope.' : ''}</p>
      </div>
    );
  })();

  return (
    <div className="dash">
      <header className="ph"><div><h1>Diario</h1><p className="sub">Comida, salidas y el día a día</p></div></header>
      {mes === hoyM && <Registro />}

      <div className="mes-h">
        <button className="icon-btn" onClick={() => setMes(sumarMeses(mes, -1))} aria-label="Mes anterior"><Ic n="chevron-left" /></button>
        <div className="mes-t"><h2 key={mes}>{mesLargo(mes)}</h2></div>
        <button className="icon-btn" onClick={() => setMes(sumarMeses(mes, 1))} aria-label="Mes siguiente"><Ic n="chevron-right" /></button>
      </div>

      <section className={`gasto-sum s-${nivel}`}>
        <span className="rotulo">Gastaste al contado</span>
        <b className="cifra num-serif"><CountUp value={total} format={fmtArs} ms={500} /></b>
        {libre != null ? (
          <>
            <div className="regla"><i className={nivel} style={{ width: `${Math.min(100, usado * 100)}%` }} /></div>
            <div className="gs-r">
              <span>de {fmtArs(libre)} {topes[mes] ? 'de tope' : 'libres del plan'}</span>
              <b className="num">{libre - total >= 0 ? `quedan ${fmtArs(libre - total)}` : `te pasaste ${fmtArs(total - libre)}`}</b>
            </div>
          </>
        ) : <p className="gs-r"><span>Este mes no está en el plan: poné un tope desde Inicio si querés compararlo.</span></p>}
        {cerro === true && <p className="marca"><Ic n="circle-check" size="s" /> Mes cerrado dentro del tope que pusiste.</p>}
        {enCredito > 0 && <p className="gs-cred"><MedioTag medio="credito" /> Además <b className="num">{fmtArs(enCredito)}</b> con crédito: no sale de este mes, se suma a Cuotas.</p>}
        {grafico}
        <dl className="gs-medios">
          {MEDIOS.map(x => <div key={x.id}><dt><MedioTag medio={x.id} /></dt><dd className="num">{fmtArs(porMedio[x.id])}</dd></div>)}
        </dl>
        {porTipo.length > 0 && (
          <details className="gs-tipos">
            <summary>Por categoría</summary>
            {porTipo.map(t => (
              <div key={t.tipo} className="gs-t">
                <span><IcTipo t={t.tipo} />{t.tipo}</span>
                <i style={{ width: `${(t.total / porTipo[0].total) * 100}%` }} />
                <b className="num">{fmtArs(t.total)}</b>
              </div>
            ))}
          </details>
        )}
      </section>

      {dias.length === 0 && sinGastoMes.length === 0 && (
        <p className="mu vacio">Todavía no cargaste gastos en {mesLargo(mes)}. Tocá Cargar para anotar el primero.</p>
      )}
      {sinGastoMes.length > 0 && <p className="mu t12">Días marcados sin gastos: {sinGastoMes.map(d => Number(d.slice(8))).join(', ')}.</p>}
      {dias.map(d => {
        const cont = totalGastos(gastosAlContado(d.items)), cred = d.total - cont;
        return (
          <section key={d.fecha} className="dia">
            <div className="dia-h"><span>{etiquetaDia(d.fecha)}</span><span className="dia-t"><b className="num">{fmtArs(cont)}</b> <span className="mu">al contado</span>{cred > 0 && <span className="mu"> · <span className="num">{fmtArs(cred)}</span> crédito</span>}</span></div>
            <ul className="lista">
              {d.items.map(g => (
                <li key={g.id} className="gd">
                  <button className="gd-main" onClick={() => editarGasto(g)} aria-label={`Editar ${g.tipo}, ${fmtArs(g.monto)}`}>
                    <IcTipo t={g.tipo} />
                    <span className="gd-t"><b>{g.tipo}</b>
                      <MedioTag medio={g.medio}>{g.medio === 'credito' && g.tarjeta
                        ? `${TARJETAS.find(t => t.id === g.tarjeta)?.corto} · ${(g.cuotas ?? 1) === 1 ? '1 pago' : `${g.cuotas} cuotas`} · desde ${mesCorto(primerPagoCredito(g.fecha, g.tarjeta))}`
                        : undefined}</MedioTag>
                    </span>
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
          </section>
        );
      })}
    </div>
  );
}
