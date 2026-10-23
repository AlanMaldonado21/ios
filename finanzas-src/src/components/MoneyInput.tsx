import { useEffect, useState } from 'react';
import { parseMonto } from '../../../lib/finanzas/diario';

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('es-AR', { maximumFractionDigits: 2 }) : '');
const limpiar = (txt: string) => {
  const [ent, dec] = txt.replace(/[^\d,]/g, '').split(',');
  const e = ent ? Number(ent).toLocaleString('es-AR') : '';
  return dec !== undefined ? `${e || '0'},${dec.slice(0, 2)}` : e;
};

/** Input de plata con formato argentino que guarda al escribir (sin botón). */
export function MoneyInput({ value, onChange, prefijo = '$', className = '', ariaLabel, sufijo }: {
  value: number; onChange: (n: number) => void; prefijo?: string; className?: string; ariaLabel?: string; sufijo?: string;
}) {
  const [txt, setTxt] = useState(fmt(value));
  const [foco, setFoco] = useState(false);
  useEffect(() => { if (!foco) setTxt(fmt(value)); }, [value, foco]);
  return (
    <label className={`money ${className}`}>
      {prefijo && <span>{prefijo}</span>}
      <input inputMode="decimal" value={txt} aria-label={ariaLabel}
        onFocus={e => { setFoco(true); e.target.select(); }}
        onBlur={() => setFoco(false)}
        onChange={e => {
          const t = limpiar(e.target.value);
          setTxt(t);
          const n = t === '' ? 0 : parseMonto(t);
          if (Number.isFinite(n)) onChange(n);
        }} />
      {sufijo && <span>{sufijo}</span>}
    </label>
  );
}
