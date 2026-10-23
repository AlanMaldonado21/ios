import { useEffect, useState } from 'react';
import { useCountUp } from './CountUp';

/** Anillo de progreso animado. pct es 0..∞ (1 = 100%). */
export function ProgressRing({ pct, size = 220, stroke = 18 }: { pct: number; size?: number; stroke?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(pct), 60); return () => clearTimeout(t); }, [pct]);
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const lleno = Math.min(shown, 1);
  const extra = Math.max(0, Math.min(shown - 1, 1));
  const n = useCountUp(pct * 100, 1100);
  const ok = pct >= 1;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ok ? 'var(--pos-2)' : 'var(--acc-2)'} />
            <stop offset="100%" stopColor={ok ? 'var(--pos)' : 'var(--acc)'} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle className="ring-arc" cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringG)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - lleno)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        {extra > 0 && (
          <circle className="ring-arc" cx={size / 2} cy={size / 2} r={r - stroke - 4} fill="none" stroke="var(--pos)" strokeOpacity={0.45}
            strokeWidth={6} strokeLinecap="round" strokeDasharray={2 * Math.PI * (r - stroke - 4)}
            strokeDashoffset={2 * Math.PI * (r - stroke - 4) * (1 - extra)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        )}
      </svg>
      <div className="ring-in">
        <b className="num">{Math.round(n)}%</b>
        <span>de la meta</span>
      </div>
    </div>
  );
}
