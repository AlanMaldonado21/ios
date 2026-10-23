import { useEffect, useState, type ReactNode } from 'react';
import { Dashboard } from './screens/Dashboard';
import { Diario } from './screens/Diario';
import { Ingresos } from './screens/Ingresos';
import { Plan } from './screens/Plan';
import { Cuotas } from './screens/Cuotas';
import { Fijos } from './screens/Fijos';
import { Config } from './screens/Config';
import { QuickAdd } from './components/QuickAdd';
import { Guardado, StoreProvider } from './store';

export type Ruta = 'inicio' | 'diario' | 'plan' | 'ingresos' | 'cuotas' | 'gastos' | 'config';

const NAV: { r: Ruta; ico: string; label: string }[] = [
  { r: 'inicio', ico: '📊', label: 'Inicio' },
  { r: 'diario', ico: '🧾', label: 'Diario' },
  { r: 'plan', ico: '🗓️', label: 'Plan' },
  { r: 'ingresos', ico: '💵', label: 'Ingresos' },
  { r: 'cuotas', ico: '💳', label: 'Cuotas' },
  { r: 'gastos', ico: '🏠', label: 'Fijos' },
];

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
  let vista: ReactNode;
  switch (ruta) {
    case 'inicio': vista = <Dashboard />; break;
    case 'diario': vista = <Diario />; break;
    case 'ingresos': vista = <Ingresos />; break;
    case 'plan': vista = <Plan />; break;
    case 'cuotas': vista = <Cuotas />; break;
    case 'gastos': vista = <Fijos />; break;
    case 'config': vista = <Config />; break;
    default: vista = <Dashboard />;
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
          <a href="#/config" className={ruta === 'config' ? 'on' : ''}><span>⚙️</span>Configuración</a>
        </nav>
      </aside>
      <div className="topbar">
        <a href="../" className="chip">‹ Hábitos</a>
        <a href="#/config" className={`chip ico ${ruta === 'config' ? 'on' : ''}`} aria-label="Configuración">⚙️</a>
      </div>
      <main className="content" key={ruta}>{vista}</main>
      <nav className="tabs"><div className="tabs-in">
        {NAV.map(n => <a key={n.r} href={`#/${n.r}`} className={ruta === n.r ? 'on' : ''}><span>{n.ico}</span>{n.label}</a>)}
      </div></nav>
    </div>
    </StoreProvider>
  );
}
