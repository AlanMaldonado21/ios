type Habito = { id: string; name: string; emoji: string; days: number[]; since: string };
type Datos = { habits: Habito[]; log: Record<string, string[]> };

/** Lee los hábitos (solo lectura): mismo origen que la app de hábitos. */
function leer(): Datos | null {
  try {
    const s = JSON.parse(localStorage.getItem('habitos-v1') || 'null');
    return s && Array.isArray(s.habits) ? { habits: s.habits, log: s.log || {} } : null;
  } catch { return null; }
}

/** Resumen de los hábitos de hoy. Tocarlo abre la app de hábitos (marcar se hace allá). */
export function HabitosHoy() {
  const d = leer();
  if (!d) return null;
  const hoy = new Date();
  const k = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const deHoy = d.habits.filter(h => k >= h.since && (h.days || []).includes(hoy.getDay()));
  if (deHoy.length === 0) return null;
  const hechos = deHoy.filter(h => (d.log[k] || []).includes(h.id));
  const faltan = deHoy.filter(h => !hechos.includes(h));
  return (
    <a className="card hh" href="../">
      <div className="hh-h">
        <span className="eyebrow-d">Hábitos de hoy</span>
        <b className={`num ${faltan.length === 0 ? 'ok' : ''}`}>{hechos.length}/{deHoy.length}{faltan.length === 0 ? ' ✓' : ''}</b>
      </div>
      <div className="hh-l">
        {deHoy.map(h => <span key={h.id} className={hechos.includes(h) ? 'ok' : ''}><i>{h.emoji}</i>{h.name.split(' (')[0]}</span>)}
      </div>
    </a>
  );
}
