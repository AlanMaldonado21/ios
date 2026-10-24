import { useEffect, useState } from 'react';
import type { SyncInfo } from '../sync.d';

/** Texto honesto del estado: nunca "Sincronizado" si algo falló o quedó sin subir. */
export function textoSync(i: SyncInfo, ahora = Date.now()): { t: string; nivel: 'ok' | 'pend' | 'err' | 'off' } {
  if (!i.enabled) return { t: 'Solo en este dispositivo', nivel: 'off' };
  if (i.status === 'out') return { t: 'Sin sesión: los cambios quedan en este dispositivo', nivel: 'off' };
  if (i.status === 'ok') return { t: 'Sincronizado', nivel: 'ok' };
  if (i.status === 'pending') return { t: i.pendientes.length ? `Pendiente de subir: ${i.pendientes.join(' y ')}` : 'Sincronizando…', nivel: 'pend' };
  const s = i.retryAt ? Math.max(0, Math.round((i.retryAt - ahora) / 1000)) : 0;
  return { t: `Error al sincronizar${i.error ? ` (${i.error})` : ''}${s ? `. Reintento en ${s} s` : ''}`, nivel: 'err' };
}

export function useSync() {
  const [i, setI] = useState<SyncInfo | null>(() => window.Sync?.info() ?? null);
  const [, tic] = useState(0);
  useEffect(() => { window.Sync?.onStatus(setI); }, []);
  // Para que la cuenta regresiva del reintento avance
  useEffect(() => { if (i?.status !== 'error') return; const t = setInterval(() => tic(n => n + 1), 1000); return () => clearInterval(t); }, [i?.status]);
  return i;
}

/** Cuenta y estado de la sincronización con Supabase (compartida con la app de hábitos). */
export function CuentaSync() {
  const i = useSync();
  const [mail, setMail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [entrando, setEntrando] = useState(false);

  if (!i || !i.enabled) return <p className="ed-help">Sincronización apagada: tus datos viven solo en este dispositivo. Exportá una copia de vez en cuando.</p>;

  if (i.status === 'out') {
    const entrar = async () => {
      setEntrando(true); setError('');
      const r = await window.Sync!.login(mail.trim(), pass);
      setEntrando(false);
      if (r.error) setError(r.error);
    };
    return (
      <form className="sy" onSubmit={e => { e.preventDefault(); entrar(); }}>
        <p className="ed-help" style={{ padding: 0 }}>Sin sesión: tus datos están solo en este dispositivo. Entrá para copiarlos a la nube y verlos en tus otros dispositivos.</p>
        <input type="email" autoComplete="username" placeholder="Email" aria-label="Email" value={mail} onChange={e => setMail(e.target.value)} />
        <input type="password" autoComplete="current-password" placeholder="Contraseña" aria-label="Contraseña" value={pass} onChange={e => setPass(e.target.value)} />
        {error && <p className="add-err">{error}</p>}
        <button className="btn-add" disabled={entrando || !mail || !pass}>{entrando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    );
  }

  const e = textoSync(i);
  return (
    <div className="sy">
      <div className="cfg-row" style={{ padding: 0 }}><div><b>{i.email}</b><small className={`sy-st sy-${e.nivel}`} role="status">{e.t}</small></div></div>
      <p className="ed-help" style={{ padding: 0 }}>Tus datos se guardan en este dispositivo y se copian a la nube con tu cuenta.</p>
      <div className="sy-b">
        <button className="link" onClick={() => window.Sync!.retry()}>{i.status === 'error' ? 'Reintentar ahora' : 'Sincronizar ahora'}</button>
        <button className="link neg" onClick={() => { if (confirm('¿Salir? Tus datos quedan en este dispositivo y en la nube.')) window.Sync!.logout(); }}>Salir</button>
      </div>
    </div>
  );
}
