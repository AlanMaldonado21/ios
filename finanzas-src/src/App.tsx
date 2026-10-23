import { useEffect, useState, type ReactNode } from 'react';
import { Dashboard } from './screens/Dashboard';
import { Diario } from './screens/Diario';
import { Ingresos } from './screens/Ingresos';
import { Plan } from './screens/Plan';
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

function Proximamente({ titulo }: { titulo: string }) {
  return (
    <div className="dash">
      <header className="ph"><div><h1>{titulo}</h1><p className="sub">Esta pantalla llega en el próximo paso</p></div></header>
      <div className="card empty"><span className="big">🚧</span>La armo cuando conectemos Supabase. Por ahora usá Inicio y Diario.</div>
    </div>
  );
}

export function App() {
  const ruta = useRuta();
  let vista: ReactNode;
  switch (ruta) {
    case 'inicio': vista = <Dashboard />; break;
    case 'diario': vista = <Diario />; break;
    case 'ingresos': vista = <Ingresos />; break;
    case 'plan': vista = <Plan />; break;
    case 'config': vista = <Proximamente titulo="Configuración" />; break;
    default: vista = <Proximamente titulo={NAV.find(n => n.r === ruta)?.label ?? 'Finanzas'} />;
  }
  return (
    <StoreProvider>
    <div className="shell">
      <Guardado />
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
