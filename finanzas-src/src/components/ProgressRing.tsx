import { useEffect, useState } from 'react';
import { useCountUp } from './CountUp';

/**
 * Aro de progreso hacia la meta. `pct` = lo ahorrado de verdad (trazo lleno).
 * `proy` = proyección si se cumple el plan (trazo fino atenuado, opcional). Nunca se confunden.
 */
export function ProgressRing({ pct, proy, size = 140, stroke = 12 }: { pct: number; proy?: number; size?: number; stroke?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(pct), 60); return () => clearTimeout(t); }, [pct]);
  const c0 = size / 2, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const lleno = Math.max(0, Math.min(shown, 1));
  const p2 = proy == null ? 0 : Math.max(0, Math.min(proy, 1));
  const n = useCountUp(pct * 100, 1100);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className="ring-track" cx={c0} cy={c0} r={r} fill="none" strokeWidth={stroke} />
        {p2 > lleno && (
          <circle className="ring-proy" cx={c0} cy={c0} r={r} fill="none" strokeWidth={Math.max(2, stroke / 4)}
            strokeDasharray={c} strokeDashoffset={c * (1 - p2)} transform={`rotate(-90 ${c0} ${c0})`} />
        )}
        <circle className="ring-arc" cx={c0} cy={c0} r={r} fill="none" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - lleno)} transform={`rotate(-90 ${c0} ${c0})`} />
      </svg>
      <div className="ring-in">
        <b className="num">{Math.round(n)}%</b>
        <span>ahorrado</span>
      </div>
    </div>
  );
}
