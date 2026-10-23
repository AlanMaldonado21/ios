import { useMemo, useRef, useState } from 'react';
import { sumarMeses } from '../../../lib/finanzas/calc';
import { MEDIOS, agruparPorDia, gastosDelMes, parseMonto, totalGastos, totalPorMedio, totalPorTipo, type Medio } from '../../../lib/finanzas/diario';
import { fmtArs, mesLargo } from '../../../lib/finanzas/format';
import { hoyISO, usePlan, useStore } from '../store';
import { CountUp } from '../components/CountUp';

const TIPOS = [
  { t: 'Comida', i: '🍔' }, { t: 'Súper', i: '🛒' }, { t: 'Salidas', i: '🍻' }, { t: 'Transporte', i: '🚕' },
  { t: 'Delivery', i: '🛵' }, { t: 'Salud', i: '💊' }, { t: 'Ropa', i: '👕' }, { t: 'Otros', i: '📦' },
];
const icoTipo = (t: string) => TIPOS.find(x => x.t.toLowerCase() === t.toLowerCase())?.i ?? '🧾';
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

/** Muestra el monto con puntos de miles mientras se escribe. */
const formatearInput = (txt: string) => {
  const [ent, dec] = txt.replace(/[^\d,]/g, '').split(',');
  const e = ent ? Number(ent).toLocaleString('es-AR') : '';
  return dec !== undefined ? `${e || '0'},${dec.slice(0, 2)}` : e;
};

export function Diario() {
  const { gastos, agregarGasto, borrarGasto } = useStore();
  const { meses } = usePlan();
  const [mes, setMes] = useState(hoyISO().slice(0, 7));
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('Comida');
  const [medio, setMedio] = useState<Medio>('debito');
  const [fecha, setFecha] = useState(hoyISO());
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [borrando, setBorrando] = useState<string | null>(null);
  const montoRef = useRef<HTMLInputElement>(null);

  const delMes = useMemo(() => gastosDelMes(gastos, mes), [gastos, mes]);
  const total = totalGastos(delMes);
  const porMedio = totalPorMedio(delMes);
  const porTipo = totalPorTipo(delMes);
  const dias = agruparPorDia(delMes);
  const plan = meses.find(m => m.mes === mes);
  const libre = plan ? plan.libre : null;
  const usado = libre && libre > 0 ? total / libre : 0;
  const nivel = usado > 1 ? 'neg' : usado > 0.8 ? 'warn' : 'pos';

  function agregar() {
    const n = parseMonto(monto);
    if (!(n > 0)) { setError('Poné un monto'); montoRef.current?.focus(); return; }
    if (!tipo.trim()) { setError('Elegí o escribí el tipo de gasto'); return; }
    agregarGasto({ fecha, tipo: tipo.trim(), monto: n, medio });
    setMonto(''); setError('');
    setNuevo(fecha);
    if (fecha.slice(0, 7) !== mes) setMes(fecha.slice(0, 7));
    if (navigator.vibrate) navigator.vibrate(20);
  }

  return (
    <div className="dash">
      <header className="ph">
        <div><h1>Gastos diarios</h1><p className="sub">Comida, salidas y el día a día</p></div>
      </header>

      {/* Alta rápida */}
      <section className="card add">
        <label className="add-l" htmlFor="monto">Monto</label>
        <div className={`add-monto ${error && !(parseMonto(monto) > 0) ? 'err' : ''}`}>
          <span>$</span>
          <input id="monto" ref={montoRef} inputMode="decimal" placeholder="0" value={monto} autoComplete="off"
            onChange={e => { setMonto(formatearInput(e.target.value)); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') agregar(); }} />
        </div>

        <span className="add-l">Tipo de gasto</span>
        <div className="tipos">
          {TIPOS.map(x => (
            <button key={x.t} className={tipo === x.t ? 'on' : ''} onClick={() => setTipo(x.t)}><span>{x.i}</span>{x.t}</button>
          ))}
        </div>
        <input className="add-txt" placeholder="u otro: farmacia, regalo, nafta…" value={TIPOS.some(x => x.t === tipo) ? '' : tipo}
          onChange={e => setTipo(e.target.value)} />

        <span className="add-l">¿Con qué pagaste?</span>
        <div className="medios">
          {MEDIOS.map(x => (
            <button key={x.id} className={`m-${x.id} ${medio === x.id ? 'on' : ''}`} onClick={() => setMedio(x.id)}><span>{x.ico}</span>{x.label}</button>
          ))}
        </div>

        <div className="add-f">
          <label><span className="add-l">Fecha</span><input type="date" value={fecha} max={hoyISO()} onChange={e => setFecha(e.target.value || hoyISO())} /></label>
          <button className="btn-add" onClick={agregar}>+ Agregar</button>
        </div>
        {error && <p className="add-err">{error}</p>}
      </section>

      {/* Mes */}
      <div className="mes-h" style={{ margin: '18px 0 12px' }}>
        <button className="nav-b" onClick={() => setMes(sumarMeses(mes, -1))} aria-label="Mes anterior">‹</button>
        <div className="mes-t"><h2 key={mes}>{mesLargo(mes)}</h2></div>
        <button className="nav-b" onClick={() => setMes(sumarMeses(mes, 1))} aria-label="Mes siguiente">›</button>
      </div>

      <section className={`card gasto-sum s-${nivel}`}>
        <span className="eyebrow-d">Gastaste</span>
        <b className="gs-n num"><CountUp value={total} format={fmtArs} ms={500} /></b>
        {libre != null ? (
          <>
            <div className="pbar big"><i className={`gs-bar ${nivel}`} style={{ width: `${Math.min(100, usado * 100)}%` }} /></div>
            <div className="gs-r">
              <span>de {fmtArs(libre)} libres del plan</span>
              <b className="num">{libre - total >= 0 ? `quedan ${fmtArs(libre - total)}` : `te pasaste ${fmtArs(total - libre)}`}</b>
            </div>
          </>
        ) : <p className="gs-r"><span>Este mes no está en el plan (nov 26 – dic 27), así que no hay "libre" para comparar.</span></p>}
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
        <div className="card empty"><span className="big">🧾</span>Todavía no cargaste gastos en {mesLargo(mes)}.<br />Arriba agregás el primero.</div>
      )}
      {dias.map(d => (
        <section key={d.fecha} className="dia">
          <div className="dia-h"><span>{etiquetaDia(d.fecha)}</span><b className="num">{fmtArs(d.total)}</b></div>
          <div className="card pad0">
            {d.items.map(g => (
              <div key={g.id} className={`gd ${nuevo === g.fecha && g === d.items[0] ? 'new' : ''}`}>
                <span className="gd-i">{icoTipo(g.tipo)}</span>
                <div className="gd-t"><b>{g.tipo}</b><span className={`medio-tag m-${g.medio}`}>{MEDIOS.find(x => x.id === g.medio)?.label}</span></div>
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
