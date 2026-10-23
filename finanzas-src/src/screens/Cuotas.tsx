import { sumarMeses, totalQueFalta, ultimoPago } from '../../../lib/finanzas/calc';
import { TARJETAS as TJ } from '../../../lib/finanzas/diario';
import { fmtArs, mesCorto, mesLargo } from '../../../lib/finanzas/format';
import type { Cuota } from '../../../lib/finanzas/types';
import { nuevoId, usePlan, useStore } from '../store';
import { MoneyInput } from '../components/MoneyInput';
import { Borrar, SelectMes, Stepper, TextoInline } from '../components/Campos';
import { CuotasChart, TARJETAS } from '../components/Charts';
import { CountUp } from '../components/CountUp';

export function Cuotas() {
  const { data: base, editar, setMesSel } = useStore();
  const { data, meses } = usePlan();
  const todas = data.cuotas;
  const desdeDiario = todas.filter(c => c.origen);
  const totalFalta = todas.reduce((a, c) => a + totalQueFalta(c), 0);
  const ult = [...meses].reverse().find(m => m.cuotas > 0);
  const opcionesMes = Array.from({ length: base.settings.mesesPlan + 6 }, (_, i) => sumarMeses(base.settings.mesInicioPlan, i - 3));
  const set = (id: string, fn: (c: Cuota) => void) => editar(d => { const c = d.cuotas.find(x => x.id === id); if (c) fn(c); });
  const porTarjeta = (t: string) => todas.filter(c => c.tarjeta === t).reduce((a, c) => a + totalQueFalta(c), 0);
  const abrir = (m: string) => { setMesSel(m); location.hash = '#/mes'; };

  const fila = (c: Cuota, editable: boolean) => (
    <div key={c.id} className="cuo-row">
      <div className="cuo-top">
        <span className={`card-chip ${c.tarjeta.startsWith('BNA') ? 'cc-bna' : 'cc-mp'}`}>{c.tarjeta.startsWith('BNA') ? 'BNA' : 'MP'}</span>
        {editable
          ? <TextoInline value={c.concepto} ariaLabel="Concepto" onChange={v => set(c.id, x => { x.concepto = v; })} />
          : <b className="cuo-n">{c.concepto} <span className="tag t-c4">desde Diario</span></b>}
        {editable && <Borrar label={c.concepto} onConfirm={() => editar(d => { d.cuotas = d.cuotas.filter(x => x.id !== c.id); })} />}
      </div>
      {editable ? (
        <div className="cuo-ed">
          <label><span>Cuota</span><MoneyInput value={c.cuotaMensual} ariaLabel="Cuota mensual" onChange={n => set(c.id, x => { x.cuotaMensual = n; })} /></label>
          <label><span>Faltan</span><Stepper value={c.cuotasRestantes} min={1} max={48} ariaLabel="Cuotas que faltan" onChange={n => set(c.id, x => { x.cuotasRestantes = n; })} /></label>
          <label><span>Tarjeta</span>
            <select className="sel-mes" value={c.tarjeta} onChange={e => set(c.id, x => { x.tarjeta = e.target.value; })}>
              {TJ.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <label><span>Primer pago</span><SelectMes value={c.primerPago} meses={opcionesMes} ariaLabel="Primer pago" onChange={m => set(c.id, x => { x.primerPago = m; })} /></label>
        </div>
      ) : (
        <div className="cuo-ro">{c.cuotasRestantes} × {fmtArs(c.cuotaMensual)} · desde {mesLargo(c.primerPago)}</div>
      )}
      <div className="cuo-foot">
        <span>Último pago <b>{mesLargo(ultimoPago(c))}</b></span>
        <span>Falta <b className="num">{fmtArs(totalQueFalta(c))}</b></span>
      </div>
    </div>
  );

  return (
    <div className="dash">
      <header className="ph"><div><h1>Cuotas</h1><p className="sub">Lo que falta pagar con tarjeta</p></div></header>

      <section className="card ing-tot">
        <span className="eyebrow-d">Total que falta</span>
        <b className="num"><CountUp value={totalFalta} format={fmtArs} ms={500} /></b>
        <div className="ing-mini">
          <div><span>Banco Nación</span><b className="num">{fmtArs(porTarjeta('BNA Visa'))}</b></div>
          <div><span>MercadoPago</span><b className="num">{fmtArs(porTarjeta('MercadoPago'))}</b></div>
          <div><span>Libre de cuotas</span><b>{ult ? mesCorto(sumarMeses(ult.mes, 1)) : 'ya'}</b></div>
        </div>
      </section>

      <section className="card">
        <div className="ch"><h2>Cuotas por mes</h2><span className="hint">Tocá un mes para abrirlo</span></div>
        <ul className="leg inline">{TARJETAS.map(t => <li key={t.key}><i style={{ background: t.color }} /><span>{t.key}</span></li>)}</ul>
        <CuotasChart meses={meses} sel="" onSel={abrir} />
      </section>

      <h3 className="sec">Cuotas pendientes</h3>
      <section className="card pad0">
        {base.cuotas.length === 0 && <p className="vacio" style={{ padding: 16 }}>No tenés cuotas cargadas a mano.</p>}
        {base.cuotas.map(c => fila(c, true))}
        <button className="ed-add" onClick={() => editar(d => {
          d.cuotas.push({ id: nuevoId(), concepto: 'Nueva cuota', tarjeta: 'BNA Visa', cuotaMensual: 0, cuotasRestantes: 1, primerPago: d.settings.mesInicioPlan });
        })}>+ Agregar cuota</button>
      </section>

      {desdeDiario.length > 0 && (
        <>
          <h3 className="sec">Compras con crédito del Diario</h3>
          <section className="card pad0">
            {desdeDiario.map(c => fila(c, false))}
            <p className="ed-help" style={{ paddingBottom: 12 }}>Para cambiarlas o borrarlas, hacelo desde el gasto en Diario.</p>
          </section>
        </>
      )}

      <h3 className="sec">Por mes y tarjeta</h3>
      <section className="card pad0">
        <div className="tbl-h"><span>Mes</span><span>BNA</span><span>MP</span><span>Total</span></div>
        {meses.map(m => {
          const bna = m.cuotasDetalle.filter(c => c.tarjeta === 'BNA Visa').reduce((a, c) => a + c.monto, 0);
          const mp = m.cuotas - bna;
          return (
            <button key={m.mes} className={`tbl-r ${m.cuotas ? '' : 'off'}`} onClick={() => abrir(m.mes)}>
              <span className="fact-m">{mesLargo(m.mes)}</span>
              <span className="num">{fmtArs(bna)}</span><span className="num">{fmtArs(mp)}</span><b className="num">{fmtArs(m.cuotas)}</b>
            </button>
          );
        })}
      </section>
    </div>
  );
}
