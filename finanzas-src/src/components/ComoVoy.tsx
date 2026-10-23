import { useState } from 'react';
import { parseMonto, ritmoMes } from '../../../lib/finanzas/diario';
import { fmtArs, mesLargo } from '../../../lib/finanzas/format';
import { hoyISO, useStore } from '../store';

const formatear = (txt: string) => {
  const d = txt.replace(/\D/g, '');
  return d ? Number(d).toLocaleString('es-AR') : '';
};

const FRASE = { pos: 'Vas bien', warn: 'Vas rápido', neg: 'Te pasaste' } as const;

/** "¿Cómo voy?": gasto real del mes de hoy contra un tope (el libre del plan, o uno que ponés a mano). */
export function ComoVoy({ librePlan }: { librePlan: number | null }) {
  const { gastos, topes, setTope } = useStore();
  const hoy = hoyISO();
  const mes = hoy.slice(0, 7);
  const manual = topes[mes] ?? null;
  const tope = manual ?? librePlan;
  const r = ritmoMes(gastos, tope, hoy);
  const [edit, setEdit] = useState(false);
  const [txt, setTxt] = useState('');

  const guardar = () => { const n = parseMonto(txt); setTope(mes, n > 0 ? n : null); setEdit(false); };
  const abrir = () => { setTxt(manual ? formatear(String(manual)) : ''); setEdit(true); };

  return (
    <section className={`card cv cv-${r.nivel}`}>
      <div className="cv-h">
        <span className="eyebrow-d">{mesLargo(mes)} · día {r.dia} de {r.diasMes}</span>
        {r.tope && <span className={`tag t-${r.nivel === 'pos' ? 'pos' : r.nivel === 'warn' ? 'warn' : 'neg'}`}>{FRASE[r.nivel]}</span>}
      </div>

      {r.tope ? (
        <>
          <b className="cv-n num">{r.quedan! >= 0 ? fmtArs(r.quedan!) : fmtArs(-r.quedan!)}</b>
          <span className="cv-l">{r.quedan! >= 0 ? `te quedan de ${fmtArs(r.tope)}` : `de más sobre ${fmtArs(r.tope)}`}</span>
          <div className="cv-bar" role="progressbar" aria-valuenow={Math.round(Math.min(1, r.gastado / r.tope) * 100)} aria-valuemin={0} aria-valuemax={100}>
            <i className={r.nivel} style={{ width: `${Math.min(100, (r.gastado / r.tope) * 100)}%` }} />
            <em style={{ left: `${(r.ideal! / r.tope) * 100}%` }} title="Dónde deberías ir hoy" />
          </div>
          <div className="cv-f">
            <span>Gastaste <b className="num">{fmtArs(r.gastado)}</b></span>
            <span>{r.porDia! > 0 ? <>≈ <b className="num">{fmtArs(r.porDia!)}</b> por día</> : 'sin margen'}</span>
          </div>
        </>
      ) : (
        <>
          <b className="cv-n num">{fmtArs(r.gastado)}</b>
          <span className="cv-l">gastado este mes · ≈ {fmtArs(r.promedioDia)} por día</span>
          {r.gastado > 0 && <p className="cv-proy">A este ritmo cerrás {mesLargo(mes).split(' ')[0]} en <b className="num">{fmtArs(r.proyeccion)}</b>.</p>}
        </>
      )}

      <div className="cv-pie">
        <span>Hoy: <b className="num">{fmtArs(r.hoy)}</b></span>
        {!edit && <button className="link" onClick={abrir}>{manual ? 'Cambiar tope' : r.tope ? 'Poner otro tope' : 'Poner un tope'}</button>}
      </div>

      {edit && (
        <div className="cv-edit">
          <span>$</span>
          <input autoFocus inputMode="numeric" placeholder={`Tope para ${mesLargo(mes).split(' ')[0]}`} value={txt}
            onChange={e => setTxt(formatear(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') guardar(); }} />
          <button className="btn-add" onClick={guardar}>Guardar</button>
          <button className="link" onClick={() => setEdit(false)}>Cancelar</button>
        </div>
      )}
      {edit && manual && <button className="link neg" onClick={() => { setTope(mes, null); setEdit(false); }}>Quitar tope manual</button>}
    </section>
  );
}
