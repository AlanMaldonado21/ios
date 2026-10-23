import { useEffect, useState, type ReactNode } from 'react';
import { Dashboard } from './screens/Dashboard';

export type Ruta = 'inicio' | 'plan' | 'ingresos' | 'cuotas' | 'gastos' | 'config';

const NAV: { r: Ruta; ico: string; label: string }[] = [
  { r: 'inicio', ico: '📊', label: 'Inicio' },
  { r: 'plan', ico: '🗓️', label: 'Plan' },
  { r: 'ingresos', ico: '💵', label: 'Ingresos' },
  { r: 'cuotas', ico: '💳', label: 'Cuotas' },
  { r: 'gastos', ico: '🧾', label: 'Gastos' },
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
      <div className="card empty"><span className="big">🚧</span>Primero aprobamos el diseño del Dashboard.</div>
    </div>
  );
}

export function App() {
  const ruta = useRuta();
  let vista: ReactNode;
  switch (ruta) {
    case 'inicio': vista = <Dashboard />; break;
    case 'config': vista = <Proximamente titulo="Configuración" />; break;
    default: vista = <Proximamente titulo={NAV.find(n => n.r === ruta)?.label ?? 'Finanzas'} />;
  }
  return (
    <div className="shell">
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
  );
}
