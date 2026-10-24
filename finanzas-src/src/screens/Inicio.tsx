import { useState } from 'react';
import { mesActualDelPlan } from '../../../lib/finanzas/calc';
import { ahorroReal } from '../../../lib/finanzas/diario';
import { fmtArs, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { HabitosHoy } from '../components/HabitosHoy';
import { ComoVoy } from '../components/ComoVoy';
import { PagosMes } from '../components/PagosMes';
import { icoTipo } from '../components/QuickAdd';
import { hoyMes, usePlan, useStore } from '../store';

const diaCorto = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(d)}/${Number(m)}`; };

/** Pantalla de todos los días: cómo voy este mes, lo último que cargué y cómo viene el ahorro. */
const LS_OCULTO = 'finanzas-ocultar-v1';

const Ojo = ({ tachado }: { tachado: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
    {tachado && <path d="M4 4l16 16" />}
  </svg>
);

export function Inicio() {
  // Ojito tipo Mercado Pago: oculta los montos. Se acuerda del último estado en este dispositivo.
  const [oculto, setOculto] = useState(() => { try { return localStorage.getItem(LS_OCULTO) === '1'; } catch { return false; } });
  const alternar = () => setOculto(o => { try { localStorage.setItem(LS_OCULTO, o ? '0' : '1'); } catch { /* sin storage */ } return !o; });
  const { gastos, checks, setMesSel } = useStore();
  const { data, meses, resumen } = usePlan();
  const mes = hoyMes();
  const planMes = meses.find(m => m.mes === mes);
  const recientes = [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 4);
  const real = ahorroReal(resumen.ahorroActualUsd, meses, checks).real;
  const meta = data.settings.metaUsd;
  const proximo = meses.find(m => !checks[m.mes]);
  const verMes = () => { setMesSel(proximo?.mes ?? mesActualDelPlan(meses.map(m => m.mes), mes)); };

  return (
    <div className={`dash ${oculto ? 'oculto' : ''}`}>
      <header className="ph ph-sm">
        <div><h1>Inicio</h1></div>
        <button className="nav-b" onClick={alternar} aria-pressed={oculto} aria-label={oculto ? 'Mostrar montos' : 'Ocultar montos'}><Ojo tachado={oculto} /></button>
      </header>
      <ComoVoy librePlan={planMes?.libre ?? null} />
      <HabitosHoy />
      <PagosMes />

      <h3 className="sec first">Últimos gastos</h3>
      {recientes.length === 0
        ? <div className="card empty" style={{ padding: '22px 12px' }}>Todavía no cargaste nada. Tocá <b>+</b> y anotá el primero.</div>
        : (
          <section className="card pad0">
            {recientes.map(g => (
              <div key={g.id} className="gd">
                <span className="gd-i">{icoTipo(g.tipo)}</span>
                <div className="gd-t"><b>{g.tipo}</b><span className={`medio-tag m-${g.medio}`}>{g.medio === 'credito' ? 'crédito' : g.medio === 'debito' ? 'débito' : 'transferencia'} · {diaCorto(g.fecha)}</span></div>
                <b className="gd-v num">{fmtArs(g.monto)}</b>
              </div>
            ))}
            <a className="ed-add" href="#/diario">Ver todos →</a>
          </section>
        )}

      <h3 className="sec">Ahorro</h3>
      <a className="card ah-mini" href="#/mes" onClick={verMes}>
        <div>
          <span className="eyebrow-d">Ahorrado de verdad</span>
          <b className="ah-n num">{fmtUsd(real, 0)} <small>de {fmtUsd(meta, 0)}</small></b>
        </div>
        <div className="pbar"><i style={{ width: `${Math.min(100, (real / meta) * 100)}%` }} /></div>
        <span className="hint">{proximo ? <>Próximo: separar <span className="num">{fmtUsd(proximo.ahorroUsd, 0)}</span> en {mesLargo(proximo.mes)}</> : 'Todos los meses separados'} · ver detalle →</span>
      </a>
    </div>
  );
}
