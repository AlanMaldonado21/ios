import { useState } from 'react';
import { sumarMeses } from '../../../lib/finanzas/calc';
import { gastosAlContado, gastosDelMes, parseMonto, ritmoMes, totalGastos, type GastoDiario } from '../../../lib/finanzas/diario';
import { fmtArs, mesLargo } from '../../../lib/finanzas/format';
import { hoyISO, useStore } from '../store';
import { Ic } from './Ic';

const formatear = (txt: string) => {
  const d = txt.replace(/\D/g, '');
  return d ? Number(d).toLocaleString('es-AR') : '';
};

const FRASE = { pos: 'Vas bien', warn: 'Vas rápido', neg: 'Te pasaste' } as const;

/** Mes cerrado dentro del tope que vos pusiste (tope manual). null si no había tope o no hay datos. */
export function cerroDentroDelTope(gastos: GastoDiario[], topes: Record<string, number>, mes: string): boolean | null {
  const t = topes[mes];
  if (!t) return null;
  const del = gastosDelMes(gastos, mes);
  if (!del.length) return null;
  return totalGastos(gastosAlContado(del)) <= t;
}

/** Gasto real del mes en curso contra un tope (el libre del plan, o uno que ponés a mano). */
export function ComoVoy({ librePlan }: { librePlan: number | null }) {
  const { gastos, topes, setTope } = useStore();
  const hoy = hoyISO();
  const mes = hoy.slice(0, 7);
  const manual = topes[mes] ?? null;
  const tope = manual ?? librePlan;
  const r = ritmoMes(gastos, tope, hoy);
  const [edit, setEdit] = useState(false);
  const [txt, setTxt] = useState('');
  const anterior = sumarMeses(mes, -1);
  const cerro = cerroDentroDelTope(gastos, topes, anterior);

  const guardar = () => { const n = parseMonto(txt); setTope(mes, n > 0 ? n : null); setEdit(false); };
  const abrir = () => { setTxt(manual ? formatear(String(manual)) : ''); setEdit(true); };

  return (
    <section className={`bloque cv cv-${r.nivel}`} aria-label="Gasto del mes">
      <div className="bloque-h">
        <h2>Gasto de {mesLargo(mes).split(' ')[0]}</h2>
        <span className="mu t12">mes en curso · día {r.dia} de {r.diasMes}</span>
      </div>

      {r.tope ? (
        <>
          <div className="cv-fila">
            <span><b className="cv-n num">{fmtArs(r.gastado)}</b> <span className="mu">al contado de {fmtArs(r.tope)}</span></span>
            <span className={`estado e-${r.nivel}`}>{FRASE[r.nivel]}</span>
          </div>
          <div className="regla cv-bar" role="progressbar" aria-label="Gastado sobre el tope" aria-valuenow={Math.round(Math.min(1, r.gastado / r.tope) * 100)} aria-valuemin={0} aria-valuemax={100}>
            <i className={r.nivel} style={{ width: `${Math.min(100, (r.gastado / r.tope) * 100)}%` }} />
            <em className="ideal" style={{ left: `${(r.ideal! / r.tope) * 100}%` }} title="Dónde deberías ir hoy" />
          </div>
          <div className="cv-f">
            <span>{r.quedan! >= 0 ? <>Quedan <b className="num">{fmtArs(r.quedan!)}</b></> : <>Te pasaste <b className="num">{fmtArs(-r.quedan!)}</b></>}</span>
            <span>{r.porDia! > 0 ? <><b className="num">{fmtArs(r.porDia!)}</b> por día</> : 'sin margen'}</span>
          </div>
        </>
      ) : (
        <>
          <div className="cv-fila"><span><b className="cv-n num">{fmtArs(r.gastado)}</b> <span className="mu">al contado</span></span></div>
          <p className="cv-f"><span>≈ <b className="num">{fmtArs(r.promedioDia)}</b> por día{r.gastado > 0 ? <> · a este ritmo cerrás en <b className="num">{fmtArs(r.proyeccion)}</b></> : null}</span></p>
        </>
      )}

      <div className="cv-pie">
        <span>Hoy al contado: <b className="num">{fmtArs(r.hoy)}</b></span>
        {!edit && <button className="b-txt" onClick={abrir}>{manual ? 'Cambiar tope' : r.tope ? 'Poner otro tope' : 'Poner un tope'}</button>}
      </div>

      {edit && (
        <div className="cv-edit">
          <label className="money"><span>$</span>
            <input autoFocus inputMode="numeric" aria-label={`Tope para ${mesLargo(mes)}`} placeholder={`Tope para ${mesLargo(mes).split(' ')[0]}`} value={txt}
              onChange={e => setTxt(formatear(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') guardar(); }} />
          </label>
          <button className="b-pri" onClick={guardar}>Guardar</button>
          <button className="b-txt" onClick={() => setEdit(false)}>Cancelar</button>
        </div>
      )}
      {edit && manual && <button className="b-txt neg" onClick={() => { setTope(mes, null); setEdit(false); }}>Quitar tope manual</button>}
      {cerro === true && (
        <p className="marca"><Ic n="circle-check" size="s" /> {mesLargo(anterior).split(' ')[0][0].toUpperCase() + mesLargo(anterior).split(' ')[0].slice(1)} cerró dentro del tope que pusiste ({fmtArs(topes[anterior])}).</p>
      )}
    </section>
  );
}
