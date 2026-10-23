import { useState, type ReactNode } from 'react';
import type { MesCalc } from '../../../lib/finanzas/calc';
import type { FinData } from '../../../lib/finanzas/types';
import { fmtArs, fmtPct, fmtUsd, mesCorto } from '../../../lib/finanzas/format';
import { CountUp } from './CountUp';

function Grupo({ ico, titulo, signo, total, tono, children, extra }: {
  ico: string; titulo: string; signo: '+' | '−'; total: number; tono: string; children: ReactNode; extra?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`grp ${open ? 'open' : ''}`} style={{ ['--t' as string]: `var(--${tono})` }}>
      <button className="grp-h" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="grp-i">{ico}</span>
        <span className="grp-t">{titulo}{extra}</span>
        <b className="num grp-v">{signo} <CountUp value={total} format={fmtArs} ms={500} /></b>
        <span className="chev" aria-hidden>›</span>
      </button>
      <div className="grp-b"><div>{children}</div></div>
    </div>
  );
}

function Fila({ nombre, detalle, valor, tag }: { nombre: ReactNode; detalle?: ReactNode; valor: ReactNode; tag?: ReactNode }) {
  return (
    <div className="fila">
      <div className="fila-n"><span>{nombre}{tag}</span>{detalle && <small>{detalle}</small>}</div>
      <span className="num fila-v">{valor}</span>
    </div>
  );
}

function Pips({ n, total }: { n: number; total: number }) {
  return (
    <span className="pips" aria-label={`Cuota ${n} de ${total}`}>
      {Array.from({ length: total }, (_, i) => <i key={i} className={i < n ? (i === n - 1 ? 'cur' : 'on') : ''} />)}
    </span>
  );
}

/** Apertura del mes: de dónde viene la plata y a dónde va. */
export function Apertura({ m, data }: { m: MesCalc; data: FinData }) {
  const dolar = data.settings.dolar;
  return (
    <div className="apertura">
      <Grupo ico="💵" titulo="Ingresos" signo="+" total={m.ingresoTotal} tono="tx">
        {data.ingresosFijos.map(i => <Fila key={i.id} nombre={i.nombre} detalle={i.esBaseAguinaldo ? 'Sueldo · base del aguinaldo' : 'Fijo mensual'} valor={fmtArs(i.montoMensual)} />)}
        <Fila nombre={`Comisión ${fmtPct(data.comisionPct)}`} detalle={<>sobre {fmtArs(m.facturacionBase)} facturados en {mesCorto(m.mesFacturado)}</>} valor={fmtArs(m.comision)} />
        {m.aguinaldo > 0 && <Fila nombre="Aguinaldo" tag={<span className="tag t-pos">extra</span>} detalle="Mitad del sueldo de Yagmour" valor={fmtArs(m.aguinaldo)} />}
      </Grupo>

      <Grupo ico="🏦" titulo="Ahorro" signo="−" total={m.ahorroPesos} tono="acc"
        extra={<span className="tag t-acc">{fmtPct(m.pct)}{m.pctManual != null ? ' · manual' : ' · auto'}</span>}>
        <div className="ahorro-b">
          <div className="pbar"><i style={{ width: `${Math.min(100, m.pct * 100)}%` }} /></div>
          <div className="ahorro-r">
            <span>{fmtPct(m.pct)} de {fmtArs(m.ingresoTotal)}</span>
            <b className="num">= {fmtUsd(m.ahorroUsd)}</b>
          </div>
          <small>a dólar {fmtArs(dolar)}{m.pctManual != null && m.hastaMeta ? ` · el automático sería ${fmtPct(m.pctAuto)}` : ''}</small>
        </div>
      </Grupo>

      <Grupo ico="💳" titulo="Cuotas" signo="−" total={m.cuotas} tono="warn"
        extra={m.cuotasDetalle.length ? <span className="tag t-warn">{m.cuotasDetalle.length} activas</span> : <span className="tag t-pos">sin cuotas 🎉</span>}>
        {m.cuotasDetalle.length === 0 && <p className="vacio">Este mes no pagás ninguna cuota.</p>}
        {m.cuotasDetalle.map(c => (
          <Fila key={c.id} nombre={c.concepto} tag={<span className={`card-chip ${c.tarjeta.startsWith('BNA') ? 'cc-bna' : 'cc-mp'}`}>{c.tarjeta.startsWith('BNA') ? 'BNA' : 'MP'}</span>}
            detalle={<><Pips n={c.numero} total={c.total} /> {c.numero === c.total ? 'última cuota' : `cuota ${c.numero} de ${c.total}`}</>}
            valor={fmtArs(c.monto)} />
        ))}
      </Grupo>

      <Grupo ico="🧾" titulo="Gastos fijos" signo="−" total={m.gastos} tono="c4">
        {data.gastosFijos.map(g => <Fila key={g.id} nombre={g.concepto} valor={fmtArs(g.montoMensual)} />)}
        {data.suscripciones.map(s => <Fila key={s.id} nombre={s.concepto} tag={<span className="tag t-c4">USD</span>} detalle={`${fmtUsd(s.montoUsd)} × ${fmtArs(dolar)}`} valor={fmtArs(s.montoUsd * dolar)} />)}
      </Grupo>

      <div className={`libre ${m.libre < 0 ? 'neg' : ''}`}>
        <div>
          <span className="libre-l">Te queda libre</span>
          <small>para comida y salidas</small>
        </div>
        <b className="num"><CountUp value={m.libre} format={fmtArs} ms={600} /></b>
      </div>
    </div>
  );
}
