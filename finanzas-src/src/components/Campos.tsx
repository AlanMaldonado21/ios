import { useState } from 'react';
import { mesLargo } from '../../../lib/finanzas/format';

/** Texto editable en línea (guarda al escribir). */
export function TextoInline({ value, onChange, ariaLabel, className = '' }: { value: string; onChange: (v: string) => void; ariaLabel: string; className?: string }) {
  return <input className={`ed-name ${className}`} value={value} aria-label={ariaLabel} onChange={e => onChange(e.target.value)} />;
}

/** Selector de mes "YYYY-MM" entre dos meses. */
export function SelectMes({ value, onChange, meses, ariaLabel }: { value: string; onChange: (m: string) => void; meses: string[]; ariaLabel: string }) {
  const opts = meses.includes(value) ? meses : [value, ...meses];
  return (
    <select className="sel-mes" value={value} aria-label={ariaLabel} onChange={e => onChange(e.target.value)}>
      {opts.map(m => <option key={m} value={m}>{mesLargo(m)}</option>)}
    </select>
  );
}

/** Número entero chico con − y + (cuotas, meses). */
export function Stepper({ value, onChange, min = 0, max = 99, ariaLabel }: { value: number; onChange: (n: number) => void; min?: number; max?: number; ariaLabel: string }) {
  return (
    <span className="stp" role="group" aria-label={ariaLabel}>
      <button onClick={() => onChange(Math.max(min, value - 1))} aria-label="Menos">−</button>
      <b className="num">{value}</b>
      <button onClick={() => onChange(Math.min(max, value + 1))} aria-label="Más">+</button>
    </span>
  );
}

/** Botón × con confirmación en el lugar. */
export function Borrar({ onConfirm, label }: { onConfirm: () => void; label: string }) {
  const [c, setC] = useState(false);
  return c
    ? <span className="gd-del"><button className="si" onClick={() => { onConfirm(); setC(false); }}>Borrar</button><button onClick={() => setC(false)}>No</button></span>
    : <button className="gd-x" onClick={() => setC(true)} aria-label={`Borrar ${label}`}>×</button>;
}
