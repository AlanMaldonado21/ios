import { useState, type ReactNode } from 'react';
import { Ic } from './Ic';

/**
 * Fila resumen (nombre, detalle, monto). Al tocarla se abre el editor debajo.
 * Borrar es una acción secundaria, de texto, lejos de "Listo", con confirmación en el lugar.
 */
export function FilaEditable({ id, abierta, setAbierta, nombre, detalle, valor, children, onBorrar, etiqueta }: {
  id: string; abierta: string | null; setAbierta: (id: string | null) => void;
  nombre: ReactNode; detalle?: ReactNode; valor: ReactNode; children: ReactNode; onBorrar?: () => void; etiqueta: string;
}) {
  const open = abierta === id;
  const [conf, setConf] = useState(false);
  return (
    <li className={`fe ${open ? 'open' : ''}`}>
      <button className="fe-h" onClick={() => { setConf(false); setAbierta(open ? null : id); }} aria-expanded={open} aria-label={`${open ? 'Cerrar' : 'Editar'} ${etiqueta}`}>
        <span className="fe-n"><b>{nombre}</b>{detalle && <small>{detalle}</small>}</span>
        <span className="fe-v num">{valor}</span>
        <Ic n="chevron-down" size="s" className={open ? 'rot' : ''} />
      </button>
      {open && (
        <div className="fe-b">
          {children}
          <div className="fe-pie">
            {onBorrar && (conf
              ? <span className="gd-del" role="group" aria-label={`¿Borrar ${etiqueta}?`}><button className="si" onClick={() => { onBorrar(); setAbierta(null); }}>Borrar</button><button onClick={() => setConf(false)}>No</button></span>
              : <button className="b-txt neg" onClick={() => setConf(true)}>Borrar</button>)}
            <button className="b-sec" onClick={() => setAbierta(null)}>Listo</button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Campo con rótulo arriba (para editores). */
export function Campo({ label, children }: { label: string; children: ReactNode }) {
  return <label className="campo"><span>{label}</span>{children}</label>;
}
