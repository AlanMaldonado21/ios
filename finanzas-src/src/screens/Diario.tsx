import { useMemo, useState } from 'react';
import { sumarMeses } from '../../../lib/finanzas/calc';
import { MEDIOS, TARJETAS, acumuladoDiario, agruparPorDia, gastosAlContado, gastosDelMes, primerPagoCredito, totalGastos, totalPorMedio, totalPorTipo } from '../../../lib/finanzas/diario';
import { fmtArs, mesCorto, mesLargo } from '../../../lib/finanzas/format';
import { hoyISO, usePlan, useStore } from '../store';
import { CountUp } from '../components/CountUp';
import { RitmoChart } from '../components/Charts';
import { icoTipo } from '../components/QuickAdd';

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

export function Diario() {
  const { gastos, topes, borrarGasto } = useStore();
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

  return (
    <div className="dash">
      <header className="ph">
        <div><h1>Gastos diarios</h1><p className="sub">Comida, salidas y el día a día</p></div>
      </header>

      {/* Mes */}
      <div className="mes-h" style={{ margin: '18px 0 12px' }}>
        <button className="nav-b" onClick={() => setMes(sumarMeses(mes, -1))} aria-label="Mes anterior">‹</button>
        <div className="mes-t"><h2 key={mes}>{mesLargo(mes)}</h2></div>
        <button className="nav-b" onClick={() => setMes(sumarMeses(mes, 1))} aria-label="Mes siguiente">›</button>
      </div>

      <section className={`card gasto-sum s-${nivel}`}>
        <span className="eyebrow-d">Gastaste al contado</span>
        <b className="gs-n num"><CountUp value={total} format={fmtArs} ms={500} /></b>
        {libre != null ? (
          <>
            <div className="pbar big"><i className={`gs-bar ${nivel}`} style={{ width: `${Math.min(100, usado * 100)}%` }} /></div>
            <div className="gs-r">
              <span>de {fmtArs(libre)} {topes[mes] ? 'de tope' : 'libres del plan'}</span>
              <b className="num">{libre - total >= 0 ? `quedan ${fmtArs(libre - total)}` : `te pasaste ${fmtArs(total - libre)}`}</b>
            </div>
          </>
        ) : <p className="gs-r"><span>Este mes no está en el plan: poné un tope desde Inicio si querés compararlo.</span></p>}
        {enCredito > 0 && <p className="gs-cred">💳 Además, <b className="num">{fmtArs(enCredito)}</b> con crédito: no salen de este mes, se suman a Cuotas.</p>}
        {total > 0 && (
          <div className="gs-graf">
            <RitmoChart puntos={acumuladoDiario(gastos, mes, mes === hoyISO().slice(0, 7) ? Number(hoyISO().slice(8)) : 31, libre)} hoy={mes === hoyISO().slice(0, 7) ? Number(hoyISO().slice(8)) : 0} />
            {libre != null && <p className="hint">Línea punteada: el ritmo para llegar justo al tope.</p>}
          </div>
        )}
        <div className="gs-medios">
          {MEDIOS.map(x => (
            <div key={x.id} className={`m-${x.id}`}><span>{x.ico} {x.id === 'transferencia' ? 'Transf.' : x.label}</span><b className="num">{fmtArs(porMedio[x.id])}</b></div>
          ))}
        </div>
        {porTipo.length > 0 && (
          <div className="gs-tipos">
            {porTipo.map(t => (
              <div key={t.tipo} className="gs-t">
                <span>{icoTipo(t.tipo)} {t.tipo}</span>
                <i style={{ width: `${(t.total / porTipo[0].total) * 100}%` }} />
                <b className="num">{fmtArs(t.total)}</b>
              </div>
            ))}
          </div>
        )}
      </section>

      {dias.length === 0 && (
        <div className="card empty"><span className="big">🧾</span>Todavía no cargaste gastos en {mesLargo(mes)}.<br />Tocá <b>+</b> para cargar el primero.</div>
      )}
      {dias.map(d => (
        <section key={d.fecha} className="dia">
          <div className="dia-h"><span>{etiquetaDia(d.fecha)}</span><b className="num">{fmtArs(d.total)}</b></div>
          <div className="card pad0">
            {d.items.map(g => (
              <div key={g.id} className={`gd `}>
                <span className="gd-i">{icoTipo(g.tipo)}</span>
                <div className="gd-t"><b>{g.tipo}</b><span className={`medio-tag m-${g.medio}`}>{g.medio === 'credito' && g.tarjeta
                  ? `${TARJETAS.find(t => t.id === g.tarjeta)?.corto} · ${(g.cuotas ?? 1) === 1 ? '1 pago' : `${g.cuotas} cuotas`} · desde ${mesCorto(primerPagoCredito(g.fecha, g.tarjeta))}`
                  : MEDIOS.find(x => x.id === g.medio)?.label}</span></div>
                <b className="gd-v num">{fmtArs(g.monto)}</b>
                {borrando === g.id ? (
                  <span className="gd-del">
                    <button className="si" onClick={() => { borrarGasto(g.id); setBorrando(null); }}>Borrar</button>
                    <button onClick={() => setBorrando(null)}>No</button>
                  </span>
                ) : <button className="gd-x" onClick={() => setBorrando(g.id)} aria-label="Borrar gasto">×</button>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
