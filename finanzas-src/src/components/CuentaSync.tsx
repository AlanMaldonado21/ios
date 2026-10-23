import { useEffect, useState } from 'react';
import type { SyncInfo } from '../sync.d';

/** Cuenta y estado de la sincronización con Supabase (compartida con la app de hábitos). */
export function CuentaSync() {
  const [i, setI] = useState<SyncInfo | null>(() => window.Sync?.info() ?? null);
  const [mail, setMail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [entrando, setEntrando] = useState(false);
  useEffect(() => { window.Sync?.onStatus(setI); }, []);

  if (!i || !i.enabled) return <p className="ed-help">Sincronización apagada: tus datos viven solo en este dispositivo.</p>;

  if (i.status === 'out') {
    const entrar = async () => {
      setEntrando(true); setError('');
      const r = await window.Sync!.login(mail.trim(), pass);
      setEntrando(false);
      if (r.error) setError(r.error);
    };
    return (
      <form className="sy" onSubmit={e => { e.preventDefault(); entrar(); }}>
        <p className="ed-help" style={{ padding: 0 }}>Entrá para tener tus datos en la nube y en todos tus dispositivos.</p>
        <input type="email" autoComplete="username" placeholder="Email" value={mail} onChange={e => setMail(e.target.value)} />
        <input type="password" autoComplete="current-password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} />
        {error && <p className="add-err">{error}</p>}
        <button className="btn-add" disabled={entrando || !mail || !pass}>{entrando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    );
  }

  const estado = i.status === 'ok' ? '✓ Sincronizado' : i.status === 'pending' ? 'Sincronizando…' : `⚠️ No se pudo sincronizar (${i.error})`;
  return (
    <div className="sy">
      <div className="cfg-row" style={{ padding: 0 }}><div><b>{i.email}</b><small>{estado}</small></div></div>
      <div className="sy-b">
        <button className="link" onClick={() => window.Sync!.syncAll()}>Sincronizar ahora</button>
        <button className="link neg" onClick={() => { if (confirm('¿Salir? Tus datos quedan en este dispositivo y en la nube.')) window.Sync!.logout(); }}>Salir</button>
      </div>
    </div>
  );
}
