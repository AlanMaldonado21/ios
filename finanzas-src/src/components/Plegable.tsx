import { useState, type ReactNode } from 'react';
import { Ic } from './Ic';

const leer = (k: string, def: boolean) => {
  try { const v = localStorage.getItem(`finanzas-plegado-${k}`); return v == null ? def : v === '1'; } catch { return def; }
};

/** Bloque con título que se abre y cierra con una flecha. Recuerda si lo dejaste abierto (solo en este dispositivo). */
export function Plegable({ id, titulo, resumen, valor, abiertoInicial = false, forzarAbierto, pie, children }: {
  id: string; titulo: string; resumen?: ReactNode; valor?: ReactNode; abiertoInicial?: boolean;
  /** Lo que se ve siempre debajo, abierto o cerrado (ej. "Agregar"). */
  pie?: ReactNode; /** Mientras sea true queda abierto (ej. editando algo de adentro). */ forzarAbierto?: boolean; children: ReactNode;
}) {
  const [propio, setPropio] = useState(() => leer(id, abiertoInicial));
  const abierto = propio || !!forzarAbierto;
  const cambiar = () => {
    const v = !abierto;
    setPropio(v);
    try { localStorage.setItem(`finanzas-plegado-${id}`, v ? '1' : '0'); } catch { /* sin storage */ }
  };
  return (
    <section className="bloque">
      <button className="plegable" onClick={cambiar} aria-expanded={abierto}>
        <span><h2>{titulo}</h2>{resumen && <span className="mu t12">{resumen}</span>}</span>
        {valor != null && <span className="num plg-v">{valor}</span>}
        <Ic n="chevron-down" className={abierto ? 'rot' : ''} />
      </button>
      {abierto && <div className="plegable-b">{children}</div>}
      {pie}
    </section>
  );
}
