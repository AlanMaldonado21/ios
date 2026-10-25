import { useState } from 'react';

type Habito = { id: string; name: string; emoji: string; color?: string; days: number[]; since: string };
type Datos = { habits: Habito[]; log: Record<string, string[]> };

const LS = 'habitos-v1';
/** Lee los hábitos: mismo origen que la app de hábitos. */
function leer(): Datos | null {
  try {
    const s = JSON.parse(localStorage.getItem(LS) || 'null');
    return s && Array.isArray(s.habits) ? { habits: s.habits, log: s.log || {} } : null;
  } catch { return null; }
}

/** Marca/desmarca un hábito de hoy. Solo toca `log[hoy]`, igual que la app de hábitos; el resto del JSON queda como estaba. */
function alternar(id: string, k: string) {
  try {
    const s = JSON.parse(localStorage.getItem(LS) || 'null');
    if (!s || !Array.isArray(s.habits)) return;
    s.log = s.log && typeof s.log === 'object' ? s.log : {};
    const arr: string[] = s.log[k] || (s.log[k] = []);
    const ix = arr.indexOf(id);
    if (ix < 0) arr.push(id); else arr.splice(ix, 1);
    if (!arr.length) delete s.log[k];
    localStorage.setItem(LS, JSON.stringify(s));
    window.Sync?.touch('habitos');
  } catch { /* sin storage */ }
}

/** Franja chica con los hábitos de hoy; se pueden marcar acá mismo. */
export function HabitosHoy() {
  const [, redibujar] = useState(0);
  const d = leer();
  if (!d) return null;
  const hoy = new Date();
  const k = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const deHoy = d.habits.filter(h => k >= h.since && (h.days || []).includes(hoy.getDay()));
  if (deHoy.length === 0) return null;
  const hechos = deHoy.filter(h => (d.log[k] || []).includes(h.id));
  const faltan = deHoy.filter(h => !hechos.includes(h));
  const tocar = (id: string, el: Element) => {
    const marca = !(d.log[k] || []).includes(id);
    alternar(id, k); window.Comun?.haptic(10); redibujar(n => n + 1);
    if (marca) window.Comun?.chispas(el);
  };
  return (
    <section className="franja" aria-label="Hábitos de hoy">
      <a className="franja-h" href="../"><span className="rotulo">Hábitos de hoy</span><b className="num">{hechos.length} de {deHoy.length}</b></a>
      <div className="hh-l">
        {deHoy.map(h => (
          <button key={h.id} className={hechos.includes(h) ? 'ok' : ''} aria-pressed={hechos.includes(h)} onClick={e => tocar(h.id, e.currentTarget)}>
            <span className="hh-c" aria-hidden>{hechos.includes(h) ? <svg className="ic s tilde-anim" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg> : null}</span>
            <i aria-hidden>{h.emoji}</i>{h.name.split(' (')[0]}
          </button>
        ))}
      </div>
      {faltan.length === 0 && <p className="mu t12" style={{ margin: '6px 0 0' }}>{deHoy.length} de {deHoy.length}. Día completo.</p>}
    </section>
  );
}
