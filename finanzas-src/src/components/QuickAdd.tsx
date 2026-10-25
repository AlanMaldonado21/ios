import { useEffect, useRef, useState } from 'react';
import { MEDIOS, TARJETAS, montosFrecuentes, parseMonto, primerPagoCredito, type Medio, type Tarjeta } from '../../../lib/finanzas/diario';
import type { GastoDiario } from '../../../lib/finanzas/diario';
import { fmtArs, mesLargo } from '../../../lib/finanzas/format';
import { hoyISO, useStore } from '../store';
import { Ic, type IcNombre } from './Ic';

export const TIPOS: { t: string; i: IcNombre }[] = [
  { t: 'Comida', i: 'utensils' }, { t: 'Súper', i: 'shopping-cart' }, { t: 'Salidas', i: 'beer' }, { t: 'Transporte', i: 'car-taxi-front' },
  { t: 'Delivery', i: 'bike' }, { t: 'Salud', i: 'pill' }, { t: 'Ropa', i: 'shirt' }, { t: 'Otros', i: 'package' },
];
/** Ícono de la categoría; un gasto con nombre propio (detalle de "Otros") lleva la etiqueta. */
export const icoTipo = (t: string): IcNombre => TIPOS.find(x => x.t.toLowerCase() === t.toLowerCase())?.i ?? 'tag';
/** Color de la categoría (ct-0 … ct-7); lo que no es una categoría conocida va como "Otros". */
export const colorTipo = (t: string) => { const i = TIPOS.findIndex(x => x.t.toLowerCase() === t.toLowerCase()); return `ct-${i < 0 ? TIPOS.length - 1 : i}`; };
export function IcTipo({ t }: { t: string }) { return <span className={`gd-i ${colorTipo(t)}`}><Ic n={icoTipo(t)} /></span>; }

const LS_ULT = 'finanzas-ult';
/** Una sola categoría para lo que no entra en las otras; se le puede escribir un detalle. */
export const OTROS = 'Otros';
type Ult = { tipo: string; medio: Medio; tarjeta: Tarjeta; cuotas: number };
const ULT0: Ult = { tipo: 'Comida', medio: 'debito', tarjeta: 'BNA Visa', cuotas: 1 };
const leerUlt = (): Ult => {
  try {
    const u: Ult = { ...ULT0, ...JSON.parse(localStorage.getItem(LS_ULT) || '{}') };
    // Se recuerda solo la categoría; un nombre escrito a mano no se arrastra al gasto siguiente.
    return TIPOS.some(x => x.t === u.tipo) ? u : { ...u, tipo: OTROS };
  } catch { return ULT0; }
};
const guardarUlt = (u: Ult) => { try { localStorage.setItem(LS_ULT, JSON.stringify(u)); } catch { /* sin storage */ } };

const formatearInput = (txt: string) => {
  const [ent, dec] = txt.replace(/[^\d,]/g, '').split(',');
  const e = ent ? Number(ent).toLocaleString('es-AR') : '';
  return dec !== undefined ? `${e || '0'},${dec.slice(0, 2)}` : e;
};
const ayerISO = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Hoja de carga rápida + aviso con "Deshacer" (8 s). Se abre desde "Cargar" en la barra. Monto → Guardar: categoría y medio se acuerdan del último gasto. */
export function QuickAdd() {
  const { sheetGasto, setSheetGasto, agregarGasto, borrarGasto, gastoEdit, guardarEdicion } = useStore();
  const [aviso, setAviso] = useState<{ id: string; msg: string; sinDeshacer?: boolean } | null>(null);
  useEffect(() => { if (sheetGasto) setAviso(null); }, [sheetGasto]);
  useEffect(() => {
    document.body.classList.toggle('con-aviso', !!aviso);
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 8000);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <>
      {sheetGasto && <Hoja key={gastoEdit?.id ?? 'nuevo'} inicial={gastoEdit} onEditado={g => { guardarEdicion(g); setSheetGasto(false); setAviso({ id: g.id, msg: 'Gasto actualizado.', sinDeshacer: true }); }} onClose={() => setSheetGasto(false)} onGuardado={(id, msg) => { setSheetGasto(false); setAviso({ id, msg }); }} agregar={agregarGasto} />}
      <div className={`toast ${aviso ? 'on' : ''}`} role="status" aria-live="polite">
        <span>{aviso?.msg}</span>
        {aviso && !aviso.sinDeshacer && <button onClick={() => { borrarGasto(aviso.id); setAviso(null); }}>Deshacer</button>}
      </div>
    </>
  );
}

function Hoja({ inicial, onEditado, onClose, onGuardado, agregar }: {
  inicial: GastoDiario | null; onEditado: (g: GastoDiario) => void;
  onClose: () => void; onGuardado: (id: string, msg: string) => void; agregar: ReturnType<typeof useStore>['agregarGasto'];
}) {
  const ult = useRef(inicial ? { tipo: inicial.tipo, medio: inicial.medio, tarjeta: inicial.tarjeta ?? ULT0.tarjeta, cuotas: inicial.cuotas ?? 1 } : leerUlt()).current;
  const { gastos } = useStore();
  const [monto, setMonto] = useState(inicial ? formatearInput(String(inicial.monto).replace('.', ',')) : '');
  const [medio, setMedio] = useState<Medio>(ult.medio);
  const [tarjeta, setTarjeta] = useState<Tarjeta>(ult.tarjeta);
  const [cuotas, setCuotas] = useState(ult.cuotas);
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoyISO());
  const [otraFecha, setOtraFecha] = useState(!!inicial && inicial.fecha !== hoyISO() && inicial.fecha !== ayerISO());
  const [bottom, setBottom] = useState(0);
  const n = parseMonto(monto);
  // Categoría elegida (chip) y detalle libre opcional para "Otros". El gasto se guarda con el detalle si hay, si no con la categoría.
  const inicialLibre = !TIPOS.some(x => x.t === ult.tipo);
  const [cat, setCat] = useState(inicialLibre ? OTROS : ult.tipo);
  const [detalle, setDetalle] = useState(inicialLibre ? ult.tipo : '');
  const tipoFinal = cat === OTROS && detalle.trim() ? detalle.trim() : cat;
  const recordada = !inicial && cat === ult.tipo;
  const frecuentes = montosFrecuentes(gastos, tipoFinal);
  const puede = n > 0 && tipoFinal.length > 0;

  // Con el teclado abierto (iOS), la hoja sube pegada al teclado.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const f = () => setBottom(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    f(); vv.addEventListener('resize', f); vv.addEventListener('scroll', f);
    return () => { vv.removeEventListener('resize', f); vv.removeEventListener('scroll', f); };
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [onClose]);

  function guardar() {
    if (!puede) return;
    const t = tipoFinal;
    if (inicial) {
      onEditado(medio === 'credito' ? { id: inicial.id, fecha, tipo: t, monto: n, medio, tarjeta, cuotas } : { id: inicial.id, fecha, tipo: t, monto: n, medio });
      return;
    }
    const id = agregar(medio === 'credito' ? { fecha, tipo: t, monto: n, medio, tarjeta, cuotas } : { fecha, tipo: t, monto: n, medio });
    guardarUlt({ tipo: cat, medio, tarjeta, cuotas });
    window.Comun?.haptic(10);
    onGuardado(id, `Guardado: ${t}, ${fmtArs(n)}, ${MEDIOS.find(m => m.id === medio)!.label.toLowerCase()}.`);
  }

  return (
    <div className="hoja-ov qa-ov" onClick={onClose} role="presentation">
      <div className="qa hoja" style={{ marginBottom: bottom }} role="dialog" aria-modal="true" aria-label="Cargar gasto" onClick={e => e.stopPropagation()}>
        <div className="qa-h"><h2>{inicial ? 'Editar gasto' : 'Cargar gasto'}</h2><button className="icon-btn" onClick={onClose} aria-label="Cerrar"><Ic n="x" /></button></div>
        <div className="add-monto">
          <span>$</span>
          <input autoFocus={!inicial} inputMode="decimal" placeholder="0" aria-label="Monto" value={monto} autoComplete="off"
            onChange={e => setMonto(formatearInput(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') guardar(); }} />
        </div>

        {!inicial && frecuentes.length > 0 && (
          <div className="qa-frec" aria-label="Montos frecuentes">
            {frecuentes.map(m => <button key={m} onClick={() => setMonto(formatearInput(String(m)))}>{fmtArs(m)}</button>)}
          </div>
        )}
        <span className="add-l qa-l">Categoría{recordada ? <em> · la última que usaste</em> : null}</span>
        <div className="tipos" role="radiogroup" aria-label="Categoría">
          {TIPOS.map(x => (
            <button key={x.t} role="radio" aria-checked={cat === x.t} className={cat === x.t ? 'on' : ''} onClick={() => setCat(x.t)}><span className={`ti ${colorTipo(x.t)}`}><Ic n={x.i} size="s" /></span>{x.t}</button>
          ))}
        </div>
        {cat === OTROS && <input className="add-txt" placeholder="Detalle (opcional): farmacia, regalo…" aria-label="Detalle del gasto" value={detalle} onChange={e => setDetalle(e.target.value)} />}

        <span className="add-l qa-l">Cómo pagaste</span>
        <div className="medios qa-medios" role="radiogroup" aria-label="Cómo pagaste">
          {MEDIOS.map(x => (
            <button key={x.id} role="radio" aria-checked={medio === x.id} className={`m-${x.id} ${medio === x.id ? 'on' : ''}`} onClick={() => setMedio(x.id)}><Ic n={x.ico} />{x.label}</button>
          ))}
        </div>

        {medio === 'credito' && (
          <div className="credito">
            <span className="add-l">Tarjeta</span>
            <div className="tarjetas">
              {TARJETAS.map(t => (
                <button key={t.id} className={`tj ${t.id === 'BNA Visa' ? 'cc-bna' : 'cc-mp'} ${tarjeta === t.id ? 'on' : ''}`} onClick={() => setTarjeta(t.id)}>
                  <span className="tj-chip" />{t.label}
                </button>
              ))}
            </div>
            <span className="add-l">Cuotas</span>
            <div className="cuotas-sel">
              {[1, 3, 6, 9, 12, 18].map(c => <button key={c} className={cuotas === c ? 'on' : ''} onClick={() => setCuotas(c)}>{c}</button>)}
            </div>
            <p className="cred-prev">
              {n > 0
                ? <>{cuotas === 1 ? 'Un pago' : `${cuotas} cuotas`} de <b className="num">{fmtArs(n / cuotas)}</b> · {cuotas === 1 ? 'se paga' : 'la primera'} en <b>{mesLargo(primerPagoCredito(fecha, tarjeta))}</b></>
                : <>Se suma solo a Cuotas del plan · {tarjeta === 'BNA Visa' ? 'BNA cierra el 22' : 'se paga el mes siguiente'}</>}
            </p>
          </div>
        )}

        <div className="qa-pie">
          <div className="qa-fecha">
            <button className={!otraFecha && fecha === hoyISO() ? 'on' : ''} onClick={() => { setFecha(hoyISO()); setOtraFecha(false); }}>Hoy</button>
            <button className={!otraFecha && fecha === ayerISO() ? 'on' : ''} onClick={() => { setFecha(ayerISO()); setOtraFecha(false); }}>Ayer</button>
            {otraFecha
              ? <input type="date" aria-label="Fecha" value={fecha} max={hoyISO()} onChange={e => setFecha(e.target.value || hoyISO())} />
              : <button aria-label="Elegir otra fecha" onClick={() => setOtraFecha(true)}><Ic n="calendar" /></button>}
          </div>
          <button className="btn-add qa-ok" disabled={!puede} onClick={guardar}>{inicial ? 'Actualizar' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
