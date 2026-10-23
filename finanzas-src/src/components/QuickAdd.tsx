import { useEffect, useRef, useState } from 'react';
import { MEDIOS, TARJETAS, parseMonto, primerPagoCredito, type Medio, type Tarjeta } from '../../../lib/finanzas/diario';
import { fmtArs, mesLargo } from '../../../lib/finanzas/format';
import { hoyISO, useStore } from '../store';

export const TIPOS = [
  { t: 'Comida', i: '🍔' }, { t: 'Súper', i: '🛒' }, { t: 'Salidas', i: '🍻' }, { t: 'Transporte', i: '🚕' },
  { t: 'Delivery', i: '🛵' }, { t: 'Salud', i: '💊' }, { t: 'Ropa', i: '👕' }, { t: 'Otros', i: '📦' },
];
export const icoTipo = (t: string) => TIPOS.find(x => x.t.toLowerCase() === t.toLowerCase())?.i ?? '🧾';

const LS_ULT = 'finanzas-ult';
type Ult = { tipo: string; medio: Medio; tarjeta: Tarjeta; cuotas: number };
const ULT0: Ult = { tipo: 'Comida', medio: 'debito', tarjeta: 'BNA Visa', cuotas: 1 };
const leerUlt = (): Ult => { try { return { ...ULT0, ...JSON.parse(localStorage.getItem(LS_ULT) || '{}') }; } catch { return ULT0; } };
const guardarUlt = (u: Ult) => { try { localStorage.setItem(LS_ULT, JSON.stringify(u)); } catch { /* sin storage */ } };

const formatearInput = (txt: string) => {
  const [ent, dec] = txt.replace(/[^\d,]/g, '').split(',');
  const e = ent ? Number(ent).toLocaleString('es-AR') : '';
  return dec !== undefined ? `${e || '0'},${dec.slice(0, 2)}` : e;
};
const ayerISO = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Botón flotante + hoja de carga rápida + aviso con "Deshacer". Monto → Guardar son 2 toques: tipo y medio se acuerdan del último gasto. */
export function QuickAdd() {
  const { sheetGasto, setSheetGasto, agregarGasto, borrarGasto } = useStore();
  const [aviso, setAviso] = useState<{ id: string; msg: string } | null>(null);
  useEffect(() => { if (sheetGasto) setAviso(null); }, [sheetGasto]);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <>
      {!sheetGasto && <button className="fab" onClick={() => setSheetGasto(true)} aria-label="Cargar gasto"><span aria-hidden>+</span></button>}
      {sheetGasto && <Hoja onClose={() => setSheetGasto(false)} onGuardado={(id, msg) => { setSheetGasto(false); setAviso({ id, msg }); }} agregar={agregarGasto} />}
      <div className={`aviso ${aviso ? 'on' : ''}`} role="status" aria-live="polite">
        <span>{aviso?.msg}</span>
        <button onClick={() => { if (aviso) borrarGasto(aviso.id); setAviso(null); }}>Deshacer</button>
      </div>
    </>
  );
}

function Hoja({ onClose, onGuardado, agregar }: {
  onClose: () => void; onGuardado: (id: string, msg: string) => void; agregar: ReturnType<typeof useStore>['agregarGasto'];
}) {
  const ult = useRef(leerUlt()).current;
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState(ult.tipo);
  const [medio, setMedio] = useState<Medio>(ult.medio);
  const [tarjeta, setTarjeta] = useState<Tarjeta>(ult.tarjeta);
  const [cuotas, setCuotas] = useState(ult.cuotas);
  const [fecha, setFecha] = useState(hoyISO());
  const [otraFecha, setOtraFecha] = useState(false);
  const [bottom, setBottom] = useState(0);
  const n = parseMonto(monto);
  const esTipoLibre = !TIPOS.some(x => x.t === tipo);
  const [otro, setOtro] = useState(esTipoLibre);
  const puede = n > 0 && tipo.trim().length > 0;

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
    const t = tipo.trim();
    const id = agregar(medio === 'credito' ? { fecha, tipo: t, monto: n, medio, tarjeta, cuotas } : { fecha, tipo: t, monto: n, medio });
    guardarUlt({ tipo: t, medio, tarjeta, cuotas });
    if (navigator.vibrate) navigator.vibrate(20);
    onGuardado(id, `✓ ${t} ${fmtArs(n)} · ${MEDIOS.find(m => m.id === medio)!.label.toLowerCase()}`);
  }

  return (
    <div className="ov" onClick={onClose} role="presentation">
      <div className="qa" style={{ bottom }} role="dialog" aria-modal="true" aria-label="Cargar gasto" onClick={e => e.stopPropagation()}>
        <div className="qa-grab" aria-hidden />
        <div className="add-monto">
          <span>$</span>
          <input autoFocus inputMode="decimal" placeholder="0" aria-label="Monto" value={monto} autoComplete="off"
            onChange={e => setMonto(formatearInput(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') guardar(); }} />
        </div>

        <div className="tipos">
          {TIPOS.map(x => (
            <button key={x.t} className={!otro && tipo === x.t ? 'on' : ''} onClick={() => { setTipo(x.t); setOtro(false); }}><span>{x.i}</span>{x.t}</button>
          ))}
          <button className={otro ? 'on' : ''} onClick={() => { setOtro(true); if (!esTipoLibre) setTipo(''); }}><span>✏️</span>Otro</button>
        </div>
        {otro && <input className="add-txt" autoFocus placeholder="farmacia, regalo, nafta…" value={tipo} onChange={e => setTipo(e.target.value)} />}

        <div className="medios qa-medios">
          {MEDIOS.map(x => (
            <button key={x.id} className={`m-${x.id} ${medio === x.id ? 'on' : ''}`} onClick={() => setMedio(x.id)}><span>{x.ico}</span>{x.label}</button>
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
              : <button aria-label="Elegir otra fecha" onClick={() => setOtraFecha(true)}>📅</button>}
          </div>
          <button className="btn-add qa-ok" disabled={!puede} onClick={guardar}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
