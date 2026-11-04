import { useState } from 'react';
import { sumarMeses, totalQueFalta, ultimoPago } from '../../../lib/finanzas/calc';
import { TARJETAS as TJ } from '../../../lib/finanzas/diario';
import { fmtArs, mesCorto, mesLargo } from '../../../lib/finanzas/format';
import type { Cuota } from '../../../lib/finanzas/types';
import { hoyISO, nuevoId, usePlan, useStore } from '../store';
import { MoneyInput } from '../components/MoneyInput';
import { SelectMes, Stepper, TextoInline } from '../components/Campos';
import { CuotasChart, DonaChart, TARJETAS } from '../components/Charts';
import { Plegable } from '../components/Plegable';
import { CountUp } from '../components/CountUp';
import { Campo, FilaEditable } from '../components/FilaEditable';
import { Ic } from '../components/Ic';

const corta = (t: string) => (t.startsWith('BNA') ? 'BNA' : 'MP');

export function Cuotas() {
  const { data: base, editar, setMesSel } = useStore();
  const { data, meses } = usePlan();
  const [abierta, setAbierta] = useState<string | null>(null);
  const todas = data.cuotas;
  const desdeDiario = todas.filter(c => c.origen);
  const totalFalta = todas.reduce((a, c) => a + totalQueFalta(c), 0);
  const ult = [...meses].reverse().find(m => m.cuotas > 0);
  const opcionesMes = Array.from({ length: base.settings.mesesPlan + 6 }, (_, i) => sumarMeses(base.settings.mesInicioPlan, i - 3));
  const set = (id: string, fn: (c: Cuota) => void) => editar(d => { const c = d.cuotas.find(x => x.id === id); if (c) fn(c); });
  const porTarjeta = (t: string) => todas.filter(c => c.tarjeta === t).reduce((a, c) => a + totalQueFalta(c), 0);
  const abrir = (m: string) => { setMesSel(m); location.hash = '#/mes'; };
  const mesHoy = meses.find(m => m.mes === hoyISO().slice(0, 7)) ?? meses[0];
  const pesan = todas.map(c => ({ c, falta: totalQueFalta(c) })).filter(x => x.falta > 0).sort((a, b) => b.falta - a.falta);
  const porMesManual = base.cuotas.reduce((a, c) => a + c.cuotaMensual, 0);
  const porMesDiario = desdeDiario.reduce((a, c) => a + c.cuotaMensual, 0);
  const colorTj = (t: string) => TARJETAS.find(x => x.key === t)?.color ?? 'var(--sel)';
  const resumen = (c: Cuota) => `${corta(c.tarjeta)} · ${c.cuotasRestantes === 1 ? 'queda 1 cuota' : `quedan ${c.cuotasRestantes} cuotas`} · hasta ${mesCorto(ultimoPago(c))}`;

  return (
    <div className="dash">
      <header className="ph"><div><h1>Cuotas</h1><p className="sub">Lo que falta pagar con tarjeta</p></div></header>

      <section className="protagonista">
        <span className="rotulo">Total que falta</span>
        <b className="cifra"><CountUp value={totalFalta} format={fmtArs} ms={500} /></b>
        <div className="reparto prot-rep">
          <div className="prot-izq">
            <ul className="leg">
              {TARJETAS.map(t => (
                <li key={t.key}><i style={{ background: t.color }} /><span>{t.key === 'BNA Visa' ? 'BNA' : t.key}</span><b className="num">{fmtArs(porTarjeta(t.key))}</b></li>
              ))}
            </ul>
          </div>
          {totalFalta > 0 && <DonaChart label={todas.length === 1 ? "compra" : "compras"} centro={`${todas.length}`}
            partes={TARJETAS.map(t => ({ name: t.key, color: t.color, value: porTarjeta(t.key) }))} />}
        </div>
        <dl className="mini">
          <div><dt>{mesHoy ? `Pagás en ${mesCorto(mesHoy.mes)}` : 'Este mes'}</dt><dd className="num">{fmtArs(mesHoy?.cuotas ?? 0)}</dd></div>
          <div><dt>Libre de cuotas</dt><dd>{ult ? mesCorto(sumarMeses(ult.mes, 1)) : 'ya'}</dd></div>
        </dl>
      </section>

      <section className="bloque">
        <div className="bloque-h"><h2>Cuotas por mes</h2><span className="mu t12">Tocá un mes para abrirlo</span></div>
        <ul className="leg inline">{TARJETAS.map(t => <li key={t.key}><i style={{ background: t.color }} /><span>{t.key}</span></li>)}</ul>
        <CuotasChart meses={meses} sel="" onSel={abrir} />
      </section>

      {pesan.length > 0 && (
        <section className="bloque">
          <div className="bloque-h"><h2>Qué pesa más</h2><span className="mu t12">Lo que falta de cada compra</span></div>
          <div className="pesa">
            {pesan.slice(0, 6).map(({ c, falta }) => (
              <div key={c.id} className="gs-t">
                <span>{c.concepto || 'Sin nombre'}</span>
                <i style={{ width: `${(falta / pesan[0].falta) * 100}%`, ['--ct' as string]: colorTj(c.tarjeta) }} />
                <b className="num">{fmtArs(falta)}</b>
              </div>
            ))}
            {pesan.length > 6 && <p className="mu t12">y {pesan.length - 6} más.</p>}
          </div>
        </section>
      )}

      <Plegable id="cuotas-pendientes" titulo="Cuotas pendientes" forzarAbierto={abierta != null && base.cuotas.some(c => c.id === abierta)}
        resumen={base.cuotas.length === 1 ? '1 compra' : `${base.cuotas.length} compras`}
        valor={<>{fmtArs(porMesManual)}<small className="mu">/mes</small></>}
        pie={<button className="b-txt agregar" onClick={() => {
          const id = nuevoId();
          editar(d => { d.cuotas.push({ id, concepto: '', tarjeta: 'BNA Visa', cuotaMensual: 0, cuotasRestantes: 1, primerPago: d.settings.mesInicioPlan }); });
          setAbierta(id);
        }}><Ic n="plus" size="s" />Agregar cuota</button>}>
        <p className="mu t12">Tocá una para editarla.</p>
        <ul className="lista">
          {base.cuotas.length === 0 && <li className="mu vacio">No tenés cuotas cargadas a mano.</li>}
          {base.cuotas.map(c => (
            <FilaEditable key={c.id} id={c.id} abierta={abierta} setAbierta={setAbierta} etiqueta={c.concepto}
              nombre={c.concepto || 'Sin nombre'} detalle={resumen(c)} valor={<>{fmtArs(c.cuotaMensual)}<small className="mu">/mes</small></>}
              onBorrar={() => editar(d => { d.cuotas = d.cuotas.filter(x => x.id !== c.id); })}>
              <div className="editor">
                <Campo label="Nombre"><TextoInline value={c.concepto} ariaLabel="Nombre de la compra" onChange={v => set(c.id, x => { x.concepto = v; })} /></Campo>
                <Campo label="Cuota mensual"><MoneyInput value={c.cuotaMensual} ariaLabel="Cuota mensual" onChange={n => set(c.id, x => { x.cuotaMensual = n; })} /></Campo>
                <Campo label="Cuotas que faltan"><Stepper value={c.cuotasRestantes} min={1} max={48} ariaLabel="Cuotas que faltan" onChange={n => set(c.id, x => { x.cuotasRestantes = n; })} /></Campo>
                <Campo label="Tarjeta">
                  <select className="sel-mes" value={c.tarjeta} onChange={e => set(c.id, x => { x.tarjeta = e.target.value; })}>
                    {TJ.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </Campo>
                <Campo label="Primer pago"><SelectMes value={c.primerPago} meses={opcionesMes} ariaLabel="Primer pago" onChange={m => set(c.id, x => { x.primerPago = m; })} /></Campo>
                <p className="mu t12">Último pago en {mesLargo(ultimoPago(c))} · falta {fmtArs(totalQueFalta(c))}</p>
              </div>
            </FilaEditable>
          ))}
        </ul>
      </Plegable>

      {desdeDiario.length > 0 && (
        <Plegable id="cuotas-diario" titulo="Compras con crédito del Diario"
          resumen={desdeDiario.length === 1 ? '1 compra' : `${desdeDiario.length} compras`}
          valor={<>{fmtArs(porMesDiario)}<small className="mu">/mes</small></>}>
          <ul className="lista">
            {desdeDiario.map(c => (
              <li key={c.id} className="fe"><div className="fe-h ro"><span className="fe-n"><b>{c.concepto}</b><small>{resumen(c)}</small></span><span className="fe-v num">{fmtArs(c.cuotaMensual)}<small className="mu">/mes</small></span></div></li>
            ))}
          </ul>
          <p className="mu t12">Para cambiarlas o borrarlas, hacelo desde el gasto en Diario.</p>
        </Plegable>
      )}

      <details className="bloque plegado">
        <summary><h2>Por mes y tarjeta</h2></summary>
        <div className="tabla">
          <div className="tbl-h"><span>Mes</span><span>BNA</span><span>MP</span><span>Total</span></div>
          {meses.map(m => {
            const bna = m.cuotasDetalle.filter(c => c.tarjeta === 'BNA Visa').reduce((a, c) => a + c.monto, 0);
            return (
              <button key={m.mes} className={`tbl-r ${m.cuotas ? '' : 'off'}`} onClick={() => abrir(m.mes)}>
                <span>{mesLargo(m.mes)}</span>
                <span className="num">{fmtArs(bna)}</span><span className="num">{fmtArs(m.cuotas - bna)}</span><b className="num">{fmtArs(m.cuotas)}</b>
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
