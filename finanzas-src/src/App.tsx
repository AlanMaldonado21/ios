import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { Inicio } from './screens/Inicio';
const Mes = lazyConRecarga(() => import('./screens/Mes').then(m => ({ default: m.Mes })));
const Diario = lazyConRecarga(() => import('./screens/Diario').then(m => ({ default: m.Diario })));
import { Ingresos } from './screens/Ingresos';
const Plan = lazyConRecarga(() => import('./screens/Plan').then(m => ({ default: m.Plan })));
const Cuotas = lazyConRecarga(() => import('./screens/Cuotas').then(m => ({ default: m.Cuotas })));
import { Fijos } from './screens/Fijos';
import { Mas } from './screens/Mas';
import { Config } from './screens/Config';
import { ErrorBoundary, lazyConRecarga } from './components/Recuperar';
import { QuickAdd } from './components/QuickAdd';
import { Guardado, StoreProvider } from './store';

export type Ruta = 'inicio' | 'mas' | 'mes' | 'diario' | 'plan' | 'ingresos' | 'cuotas' | 'gastos' | 'config';

const NAV: { r: Ruta; ico: string; label: string }[] = [
  { r: 'inicio', ico: '📊', label: 'Inicio' },
  { r: 'diario', ico: '🧾', label: 'Diario' },
  { r: 'plan', ico: '🗓️', label: 'Plan' },
  { r: 'ingresos', ico: '💵', label: 'Ingresos' },
  { r: 'cuotas', ico: '💳', label: 'Cuotas' },
  { r: 'gastos', ico: '🏠', label: 'Fijos' },
];

const TABS: { r: Ruta; ico: string; label: string }[] = [
  { r: 'inicio', ico: '📊', label: 'Inicio' },
  { r: 'diario', ico: '🧾', label: 'Diario' },
  { r: 'plan', ico: '🗓️', label: 'Plan' },
  { r: 'mas', ico: '☰', label: 'Más' },
];
/** Qué solapa del celu se ilumina para cada ruta. */
const tabDe = (r: Ruta): Ruta => (['mes', 'ingresos', 'cuotas', 'gastos', 'config'].includes(r) ? 'mas' : r);

function useRuta(): Ruta {
  const leer = () => (location.hash.replace(/^#\/?/, '') || 'inicio') as Ruta;
  const [r, setR] = useState<Ruta>(leer);
  useEffect(() => {
    const f = () => { setR(leer()); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return r;
}

export function App() {
  const ruta = useRuta();
  const tabActiva = tabDe(ruta);
  let vista: ReactNode;
  switch (ruta) {
    case 'inicio': vista = <Inicio />; break;
    case 'mes': vista = <Mes />; break;
    case 'diario': vista = <Diario />; break;
    case 'ingresos': vista = <Ingresos />; break;
    case 'plan': vista = <Plan />; break;
    case 'cuotas': vista = <Cuotas />; break;
    case 'gastos': vista = <Fijos />; break;
    case 'mas': vista = <Mas />; break;
    case 'config': vista = <Config />; break;
    default: vista = <Inicio />;
  }
  return (
    <StoreProvider>
    <div className="shell">
      <Guardado />
      {ruta !== 'config' && <QuickAdd />}
      <aside className="side">
        <a className="side-back" href="../">‹ Hábitos</a>
        <div className="side-brand"><span>💰</span>Finanzas</div>
        <nav>
          {NAV.map(n => <a key={n.r} href={`#/${n.r}`} className={ruta === n.r ? 'on' : ''}><span>{n.ico}</span>{n.label}</a>)}
          <a href="#/mes" className={ruta === 'mes' ? 'on' : ''}><span>📅</span>Detalle del mes</a>
          <a href="#/config" className={ruta === 'config' ? 'on' : ''}><span>⚙️</span>Configuración</a>
        </nav>
      </aside>
      <div className="topbar">
        <a href="../" className="chip">‹ Hábitos</a>
        <a href="#/config" className={`chip ico ${ruta === 'config' ? 'on' : ''}`} aria-label="Configuración">⚙️</a>
      </div>
      <main className="content" key={ruta}><ErrorBoundary clave={ruta}><Suspense fallback={<div className="cargando" aria-busy="true" />}>{vista}</Suspense></ErrorBoundary></main>
      <nav className="tabs"><div className="tabs-in">
        {TABS.map(n => <a key={n.r} href={`#/${n.r}`} className={tabActiva === n.r ? 'on' : ''}><span>{n.ico}</span>{n.label}</a>)}
      </div></nav>
    </div>
    </StoreProvider>
  );
}
