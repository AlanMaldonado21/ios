import { Component, lazy, type ComponentType, type ReactNode } from 'react';

const FLAG = 'finanzas-recarga-chunk';
const esChunkViejo = (e: unknown) =>
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i.test(String((e as Error)?.message ?? e));

/** Recarga la página una sola vez (por sesión de pestaña) cuando falta un chunk viejo después de un deploy. */
function recargarUnaVez(): boolean {
  try {
    if (sessionStorage.getItem(FLAG)) return false;
    sessionStorage.setItem(FLAG, String(Date.now()));
  } catch { return false; }
  location.reload();
  return true;
}
// Si la página quedó estable un rato, se habilita de nuevo la recarga automática para el próximo deploy.
setTimeout(() => { try { sessionStorage.removeItem(FLAG); } catch { /* */ } }, 15000);
// Vite avisa así cuando falla la precarga de un chunk.
addEventListener('vite:preloadError', e => { if (recargarUnaVez()) e.preventDefault(); });

/** lazy() que, si el chunk ya no existe (deploy nuevo), recarga una vez; si vuelve a fallar, deja el error al boundary. */
export function lazyConRecarga<T extends ComponentType<object>>(f: () => Promise<{ default: T }>) {
  return lazy(() => f().catch(e => {
    if (esChunkViejo(e) && recargarUnaVez()) return new Promise<never>(() => {});
    throw e;
  }));
}

/** Si una pantalla se rompe, muestra un mensaje y un botón para recargar en vez de quedar en blanco. */
export class ErrorBoundary extends Component<{ children: ReactNode; clave?: string }, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) { return { error }; }
  componentDidUpdate(prev: { clave?: string }) { if (prev.clave !== this.props.clave && this.state.error) this.setState({ error: null }); }
  componentDidCatch(error: unknown) { console.error(error); }
  render() {
    if (!this.state.error) return this.props.children;
    const viejo = esChunkViejo(this.state.error);
    return (
      <div className="falla" role="alert">
        <h2>{viejo ? 'Hay una versión nueva' : 'Esta pantalla no cargó'}</h2>
        <p>{viejo ? 'La app se actualizó mientras la tenías abierta. Recargá para seguir.' : 'Tus datos están bien guardados. Recargá para volver a intentar.'}</p>
        <button className="btn-add" onClick={() => location.reload()}>Recargar</button>
      </div>
    );
  }
}
