import { useState, type ReactNode } from 'react';
import { cuotaActiva, facturacionDe, mesActualDelPlan, totalQueFalta } from '../../../lib/finanzas/calc';
import { TARJETAS } from '../../../lib/finanzas/diario';
import { fmtArs, fmtPct, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { hoyMes, nuevoId, usePlan, useStore } from '../store';
import { MoneyInput } from '../components/MoneyInput';
import { Borrar, Stepper, TextoInline } from '../components/Campos';
import { Ic } from '../components/Ic';

const PASOS = ['Ingresos', 'Fijos', 'Cuotas', 'Ahorro', 'Resumen'] as const;

function Fila({ children, quitar, etiqueta }: { children: ReactNode; quitar?: () => void; etiqueta: string }) {
  return <li className="arm-fila"><div className="arm-campos">{children}</div>{quitar && <Borrar onConfirm={quitar} label={etiqueta} />}</li>;
}

/** Asistente para armar el mes de punta a punta: de dónde entra la plata y a dónde va, con el libre en vivo. */
export function Armar() {
  const { editar } = useStore();
  const { data, meses } = usePlan();
  const [paso, setPaso] = useState(0);
  const m = meses.find(x => x.mes === mesActualDelPlan(meses.map(y => y.mes), hoyMes())) ?? meses[0];
  if (!m) return null;
  const dolar = data.settings.dolar;
  const base = data.cuotas.filter(c => !c.origen);
  const delDiario = data.cuotas.filter(c => c.origen && cuotaActiva(c, m.mes));
  const setFact = (mes: string, monto: number) => editar(d => { const f = d.facturacion.find(x => x.mes === mes); if (f) f.monto = monto; else d.facturacion.push({ mes, monto }); });
  const setPct = (p: number | null) => editar(d => { const o = d.overrides.find(x => x.mes === m.mes); if (o) o.porcentajeManual = p; else d.overrides.push({ mes: m.mes, porcentajeManual: p }); });
  const pctAhora = Math.round(m.pct * 100);
  const sub = PASOS[paso];

  return (
    <div className="dash">
      <header className="ph"><div><h1>Armar mi mes</h1><p className="sub">{mesLargo(m.mes)} · paso {paso + 1} de {PASOS.length}</p></div></header>

      <ol className="arm-pasos" aria-label="Pasos">
        {PASOS.map((p, i) => <li key={p}><button className={i === paso ? 'on' : i < paso ? 'ok' : ''} aria-current={i === paso ? 'step' : undefined} onClick={() => setPaso(i)}>{i < paso ? <Ic n="check" size="s" /> : i + 1}<span>{p}</span></button></li>)}
      </ol>

      <div className={`arm-libre ${m.libre < 0 ? 'neg' : ''}`} role="status">
        <span>Te queda libre <small>para comida y salidas</small></span><b className="num">{fmtArs(m.libre)}</b>
      </div>

      {paso === 0 && (
        <section className="bloque">
          <div className="bloque-h"><h2>¿De dónde entra la plata?</h2></div>
          <p className="mu t12">Lo que cobrás fijo cada mes. La comisión por ventas va abajo.</p>
          <ul className="arm-lista">
            {data.ingresosFijos.map(i => (
              <Fila key={i.id} etiqueta={i.nombre} quitar={() => editar(d => { d.ingresosFijos = d.ingresosFijos.filter(x => x.id !== i.id); })}>
                <TextoInline value={i.nombre} ariaLabel="Nombre de la fuente" onChange={v => editar(d => { d.ingresosFijos.find(x => x.id === i.id)!.nombre = v; })} />
                <MoneyInput value={i.montoMensual} ariaLabel={`Monto de ${i.nombre}`} onChange={n => editar(d => { d.ingresosFijos.find(x => x.id === i.id)!.montoMensual = n; })} />
              </Fila>
            ))}
          </ul>
          <button className="b-txt agregar" onClick={() => editar(d => { d.ingresosFijos.push({ id: nuevoId(), nombre: '', montoMensual: 0, esBaseAguinaldo: false }); })}><Ic n="plus" size="s" />Agregar fuente</button>
          <div className="editor arm-com">
            <span className="arm-rot">Comisión por ventas</span>
            <label className="campo"><span>Porcentaje</span><MoneyInput value={Math.round(data.comisionPct * 10000) / 100} prefijo="" sufijo="%" ariaLabel="Porcentaje de comisión" onChange={n => editar(d => { d.comisionPct = n / 100; })} /></label>
            <label className="campo"><span>Facturado en {mesLargo(m.mesFacturado)}</span><MoneyInput value={facturacionDe(data, m.mesFacturado)} ariaLabel="Facturación del mes anterior" onChange={n => setFact(m.mesFacturado, n)} /></label>
            <p className="mu t12">Se cobra el mes siguiente: este mes entran <b className="num">{fmtArs(m.comision)}</b>.</p>
          </div>
          <div className="total"><span>Entra este mes</span><b className="num">{fmtArs(m.ingresoTotal)}</b></div>
        </section>
      )}

      {paso === 1 && (
        <section className="bloque">
          <div className="bloque-h"><h2>¿Qué pagás todos los meses?</h2></div>
          <p className="mu t12">Servicios, alquiler, contador… lo que no cambia.</p>
          <ul className="arm-lista">
            {data.gastosFijos.map(g => (
              <Fila key={g.id} etiqueta={g.concepto} quitar={() => editar(d => { d.gastosFijos = d.gastosFijos.filter(x => x.id !== g.id); })}>
                <TextoInline value={g.concepto} ariaLabel="Nombre del gasto" onChange={v => editar(d => { d.gastosFijos.find(x => x.id === g.id)!.concepto = v; })} />
                <MoneyInput value={g.montoMensual} ariaLabel={`Monto de ${g.concepto}`} onChange={n => editar(d => { d.gastosFijos.find(x => x.id === g.id)!.montoMensual = n; })} />
              </Fila>
            ))}
          </ul>
          <button className="b-txt agregar" onClick={() => editar(d => { d.gastosFijos.push({ id: nuevoId(), concepto: '', montoMensual: 0 }); })}><Ic n="plus" size="s" />Agregar gasto fijo</button>
          <div className="bloque-h arm-sub"><h2>Suscripciones en dólares</h2><span className="mu t12">a $ {dolar.toLocaleString('es-AR')}</span></div>
          <ul className="arm-lista">
            {data.suscripciones.map(s => (
              <Fila key={s.id} etiqueta={s.concepto} quitar={() => editar(d => { d.suscripciones = d.suscripciones.filter(x => x.id !== s.id); })}>
                <TextoInline value={s.concepto} ariaLabel="Nombre de la suscripción" onChange={v => editar(d => { d.suscripciones.find(x => x.id === s.id)!.concepto = v; })} />
                <MoneyInput value={s.montoUsd} prefijo="U$S" ariaLabel={`Dólares de ${s.concepto}`} onChange={n => editar(d => { d.suscripciones.find(x => x.id === s.id)!.montoUsd = n; })} />
              </Fila>
            ))}
          </ul>
          <button className="b-txt agregar" onClick={() => editar(d => { d.suscripciones.push({ id: nuevoId(), concepto: '', montoUsd: 0 }); })}><Ic n="plus" size="s" />Agregar suscripción</button>
          <div className="total"><span>Fijos del mes</span><b className="num">{fmtArs(m.gastos)}</b></div>
        </section>
      )}

      {paso === 2 && (
        <section className="bloque">
          <div className="bloque-h"><h2>¿Qué cuotas pagás?</h2></div>
          <p className="mu t12">Compras en cuotas que ya tenías. Lo que cargues con crédito en Diario se suma solo.</p>
          <ul className="arm-lista">
            {base.map(c => (
              <Fila key={c.id} etiqueta={c.concepto} quitar={() => editar(d => { d.cuotas = d.cuotas.filter(x => x.id !== c.id); })}>
                <TextoInline value={c.concepto} ariaLabel="Nombre de la compra" onChange={v => editar(d => { d.cuotas.find(x => x.id === c.id)!.concepto = v; })} />
                <MoneyInput value={c.cuotaMensual} ariaLabel={`Cuota de ${c.concepto}`} onChange={n => editar(d => { d.cuotas.find(x => x.id === c.id)!.cuotaMensual = n; })} />
                <select className="sel-mes" aria-label="Tarjeta" value={c.tarjeta} onChange={e => editar(d => { d.cuotas.find(x => x.id === c.id)!.tarjeta = e.target.value; })}>
                  {TARJETAS.map(t => <option key={t.id} value={t.id}>{t.corto}</option>)}
                </select>
                <span className="arm-resta"><Stepper value={c.cuotasRestantes} min={1} max={48} ariaLabel={`Cuotas que faltan de ${c.concepto}`} onChange={n => editar(d => { d.cuotas.find(x => x.id === c.id)!.cuotasRestantes = n; })} /> <small className="mu">que faltan · falta {fmtArs(totalQueFalta(c))}</small></span>
              </Fila>
            ))}
          </ul>
          <button className="b-txt agregar" onClick={() => editar(d => { d.cuotas.push({ id: nuevoId(), concepto: '', tarjeta: 'BNA Visa', cuotaMensual: 0, cuotasRestantes: 1, primerPago: m.mes }); })}><Ic n="plus" size="s" />Agregar cuota</button>
          {delDiario.length > 0 && <p className="mu t12">Más {delDiario.length === 1 ? '1 compra' : `${delDiario.length} compras`} con crédito de Diario: {fmtArs(delDiario.reduce((a, c) => a + c.cuotaMensual, 0))} (se cambian desde el gasto).</p>}
          <div className="total"><span>Cuotas del mes</span><b className="num">{fmtArs(m.cuotas)}</b></div>
        </section>
      )}

      {paso === 3 && (
        <section className="bloque">
          <div className="bloque-h"><h2>¿Cuánto ahorrás este mes?</h2></div>
          <p className="mu t12">Es un porcentaje de lo que entra. El automático reparte lo que falta para tu meta en partes iguales.</p>
          <div className="arm-pct">
            <button className="icon-btn" aria-label="Bajar 1%" onClick={() => setPct(Math.max(0, pctAhora - 1) / 100)}><Ic n="chevron-left" /></button>
            <b className="num">{fmtPct(m.pct)}</b>
            <button className="icon-btn" aria-label="Subir 1%" onClick={() => setPct(Math.min(100, pctAhora + 1) / 100)}><Ic n="chevron-right" /></button>
          </div>
          <p className="arm-pct-t"><b className="num">{fmtArs(m.ahorroPesos)}</b> = {fmtUsd(m.ahorroUsd)} a dólar {fmtArs(dolar)}</p>
          {m.pctManual != null
            ? <button className="b-txt" onClick={() => setPct(null)}>Volver al automático ({fmtPct(m.pctAuto)})</button>
            : <p className="mu t12">Automático para llegar a la meta.</p>}
        </section>
      )}

      {paso === 4 && (
        <section className="bloque">
          <div className="bloque-h"><h2>Tu {mesLargo(m.mes).split(' ')[0]}</h2></div>
          <dl className="arm-res">
            <div><dt>Entra</dt><dd className="num">+ {fmtArs(m.ingresoTotal)}</dd></div>
            <div><dt>Ahorro ({fmtPct(m.pct)})</dt><dd className="num">− {fmtArs(m.ahorroPesos)}</dd></div>
            <div><dt>Cuotas</dt><dd className="num">− {fmtArs(m.cuotas)}</dd></div>
            <div><dt>Gastos fijos</dt><dd className="num">− {fmtArs(m.gastos)}</dd></div>
          </dl>
          <div className={`libre ${m.libre < 0 ? 'neg' : ''}`}><div><span className="libre-l">Te queda libre</span><small>para comida y salidas</small></div><b className="num">{fmtArs(m.libre)}</b></div>
          {m.libre < 0 && <p className="arm-aviso">Estás gastando más de lo que entra. Bajá el ahorro o revisá los pasos anteriores.</p>}
          <p className="mu t12">Desde Inicio marcás lo que vas cobrando y pagando, y la app te va diciendo qué falta.</p>
          <a className="b-pri arm-fin" href="#/inicio">Listo, ir a Inicio</a>
        </section>
      )}

      <div className="arm-nav">
        <button className="b-sec" onClick={() => setPaso(p => Math.max(0, p - 1))} disabled={paso === 0}>Atrás</button>
        {paso < PASOS.length - 1 && <button className="b-pri" onClick={() => { setPaso(p => p + 1); window.scrollTo(0, 0); }}>{sub === 'Ahorro' ? 'Ver resumen' : 'Siguiente'}</button>}
      </div>
    </div>
  );
}
