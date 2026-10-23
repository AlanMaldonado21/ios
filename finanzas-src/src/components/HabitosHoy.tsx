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

/** Resumen de los hábitos de hoy. Tocarlo abre la app de hábitos (marcar se hace allá). */
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
  const tocar = (id: string) => { alternar(id, k); if (navigator.vibrate) navigator.vibrate(20); redibujar(n => n + 1); };
  return (
    <section className="card hh">
      <div className="hh-h">
        <span className="eyebrow-d">Hábitos de hoy</span>
        <b className={`num ${faltan.length === 0 ? 'ok' : ''}`}>{hechos.length}/{deHoy.length}{faltan.length === 0 ? ' ✓' : ''}</b>
      </div>
      <div className="hh-l">
        {deHoy.map(h => (
          <button key={h.id} className={hechos.includes(h) ? 'ok' : ''} aria-pressed={hechos.includes(h)} onClick={() => tocar(h.id)}>
            <i>{h.emoji}</i>{h.name.split(' (')[0]}
          </button>
        ))}
      </div>
    </section>
  );
}
