import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { Inicio } from './screens/Inicio';
import { Ingresos } from './screens/Ingresos';
import { Fijos } from './screens/Fijos';
import { Mas } from './screens/Mas';
import { Config } from './screens/Config';
import { ErrorBoundary, lazyConRecarga } from './components/Recuperar';
import { QuickAdd } from './components/QuickAdd';
import { Ic, type IcNombre } from './components/Ic';
import { Pulso } from './components/Pulso';
import { textoSync, useSync } from './components/CuentaSync';
import { CopiaResumen, Guardado, StoreProvider, useStore } from './store';
import { setMascara } from '../../lib/finanzas/format';

const Mes = lazyConRecarga(() => import('./screens/Mes').then(m => ({ default: m.Mes })));
const Diario = lazyConRecarga(() => import('./screens/Diario').then(m => ({ default: m.Diario })));
const Plan = lazyConRecarga(() => import('./screens/Plan').then(m => ({ default: m.Plan })));
const Cuotas = lazyConRecarga(() => import('./screens/Cuotas').then(m => ({ default: m.Cuotas })));

export type Ruta = 'inicio' | 'mas' | 'mes' | 'diario' | 'plan' | 'ingresos' | 'cuotas' | 'gastos' | 'config';

type Item = { r: Ruta; ico: IcNombre; label: string };
/** Rail de escritorio: todas las pantallas. */
const NAV: Item[] = [
  { r: 'inicio', ico: 'house', label: 'Inicio' },
  { r: 'diario', ico: 'notebook-pen', label: 'Diario' },
  { r: 'plan', ico: 'calendar-range', label: 'Plan' },
  { r: 'mes', ico: 'calendar-days', label: 'Detalle del mes' },
  { r: 'ingresos', ico: 'landmark', label: 'Ingresos' },
  { r: 'cuotas', ico: 'credit-card', label: 'Cuotas' },
  { r: 'gastos', ico: 'receipt', label: 'Gastos fijos' },
];
/** Tab bar del celu: 2 + Cargar + 2. */
const TABS_A: Item[] = [{ r: 'inicio', ico: 'house', label: 'Inicio' }, { r: 'diario', ico: 'notebook-pen', label: 'Diario' }];
const TABS_B: Item[] = [{ r: 'plan', ico: 'calendar-range', label: 'Plan' }, { r: 'mas', ico: 'ellipsis', label: 'Más' }];
/** Qué solapa del celu se ilumina para cada ruta. */
const tabDe = (r: Ruta): Ruta => (['mes', 'ingresos', 'cuotas', 'gastos', 'config'].includes(r) ? 'mas' : r);

const RUTAS: Ruta[] = ['inicio', 'mas', 'mes', 'diario', 'plan', 'ingresos', 'cuotas', 'gastos', 'config'];
function useRuta(): Ruta {
  const leer = () => { const r = location.hash.replace(/^#\/?/, '') as Ruta; return RUTAS.includes(r) ? r : 'inicio'; };
  const [r, setR] = useState<Ruta>(leer);
  useEffect(() => {
    const f = () => { setR(leer()); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return r;
}

/** Ojito: oculta todos los montos en las dos apps. Se acuerda en este dispositivo. */
function usePrivado() {
  const [p, setP] = useState(() => window.Comun?.privado() ?? false);
  setMascara(p);
  useEffect(() => { window.Comun?.onPrivado(setP); }, []);
  return [p, (v: boolean) => { window.Comun?.setPrivado(v); setP(v); }] as const;
}

function Ojo({ p, set }: { p: boolean; set: (v: boolean) => void }) {
  return (
    <button className="icon-btn" onClick={() => set(!p)} aria-pressed={p} aria-label={p ? 'Mostrar montos' : 'Ocultar montos'} title={p ? 'Mostrar montos' : 'Ocultar montos'}>
      <Ic n={p ? 'eye-off' : 'eye'} />
    </button>
  );
}

function EstadoSync() {
  const i = useSync();
  if (!i || !i.enabled) return null;
  const e = textoSync(i);
  return (
    <a className="icon-btn" href="#/config" aria-label={`Sincronización: ${e.t}`} title={e.t}>
      <span className={`sync-dot ${e.nivel}`} aria-hidden />
    </a>
  );
}

function Cargar({ className, children }: { className: string; children: ReactNode }) {
  const { setSheetGasto } = useStore();
  return <button className={className} onClick={() => setSheetGasto(true)} aria-label="Cargar gasto">{children}</button>;
}

export function App() {
  const ruta = useRuta();
  const [privado, setPrivado] = usePrivado();
  const tabActiva = tabDe(ruta);
  let vista: ReactNode;
  switch (ruta) {
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
  const cur = (r: Ruta, activa: Ruta) => (r === activa ? 'page' as const : undefined);
  return (
    <StoreProvider>
      <CopiaResumen />
      <Guardado />
      <QuickAdd />

      <header className="app-top">
        <div className="app-top-in">
          <nav className="modsw" aria-label="Cambiar de módulo">
            <a href="../"><Ic n="list-checks" size="s" />Hábitos</a>
            <a href="#/inicio" aria-current="page"><Ic n="wallet" size="s" />Finanzas</a>
          </nav>
          <EstadoSync />
          <Ojo p={privado} set={setPrivado} />
          <a className="icon-btn" href="#/config" aria-label="Configuración" aria-current={cur('config', ruta)}><Ic n="settings" /></a>
        </div>
      </header>

      <aside className="rail" aria-label="Navegación">
        <nav className="modsw" aria-label="Cambiar de módulo">
          <a href="../">Hábitos</a>
          <a href="#/inicio" aria-current="page">Finanzas</a>
        </nav>
        <nav aria-label="Finanzas">
          <Cargar className="rail-cargar"><Ic n="plus" />Cargar gasto</Cargar>
          {NAV.map(n => <a key={n.r} href={`#/${n.r}`} aria-current={cur(n.r, ruta)}><Ic n={n.ico} />{n.label}</a>)}
        </nav>
        <Pulso key={`p-${privado}`} />
        <div className="rail-pie">
          <Ojo p={privado} set={setPrivado} />
          <a className="icon-btn" href="#/config" aria-label="Configuración" aria-current={cur('config', ruta)}><Ic n="settings" /></a>
          <EstadoSync />
        </div>
      </aside>

      <div className="con-rail con-tabbar">
        <div className="solo-mobile"><Pulso key={`m-${privado}`} /></div>
        <main className="content" key={`${ruta}-${privado}`}>
          <ErrorBoundary clave={ruta}><Suspense fallback={<div className="cargando" aria-busy="true" />}>{vista}</Suspense></ErrorBoundary>
        </main>
      </div>

      <nav className="tabbar" aria-label="Finanzas">
        <div className="tabbar-in">
          {TABS_A.map(n => <a key={n.r} href={`#/${n.r}`} aria-current={cur(n.r, tabActiva)}><Ic n={n.ico} />{n.label}</a>)}
          <Cargar className="tab-cargar"><span className="pill"><Ic n="plus" /></span><small>Cargar</small></Cargar>
          {TABS_B.map(n => <a key={n.r} href={`#/${n.r}`} aria-current={cur(n.r, tabActiva)}><Ic n={n.ico} />{n.label}</a>)}
        </div>
      </nav>
    </StoreProvider>
  );
}
