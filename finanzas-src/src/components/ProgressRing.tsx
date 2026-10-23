import { useEffect, useState } from 'react';
import { useCountUp } from './CountUp';

/** Anillo de progreso animado. pct es 0..∞ (1 = 100%). Lo que pasa de 100% se dibuja como un segundo arco interno. */
export function ProgressRing({ pct, size = 140, stroke = 12 }: { pct: number; size?: number; stroke?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = setTimeout(() => setShown(pct), 60); return () => clearTimeout(t); }, [pct]);
  const c0 = size / 2, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const r2 = r - stroke + 1, c2 = 2 * Math.PI * r2;
  const lleno = Math.min(shown, 1);
  const extra = Math.max(0, Math.min(shown - 1, 1));
  const n = useCountUp(pct * 100, 1100);
  const ok = pct >= 1;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ok ? '#b6f27a' : '#86dbff'} />
            <stop offset="100%" stopColor={ok ? '#58cc02' : '#1cb0f6'} />
          </linearGradient>
        </defs>
        <circle cx={c0} cy={c0} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={stroke} />
        <circle className="ring-arc" cx={c0} cy={c0} r={r} fill="none" stroke="url(#ringG)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - lleno)} transform={`rotate(-90 ${c0} ${c0})`} />
        {extra > 0 && (
          <circle className="ring-arc" cx={c0} cy={c0} r={r2} fill="none" stroke="#b6f27a" strokeOpacity={0.55}
            strokeWidth={4} strokeLinecap="round" strokeDasharray={c2} strokeDashoffset={c2 * (1 - extra)} transform={`rotate(-90 ${c0} ${c0})`} />
        )}
      </svg>
      <div className="ring-in">
        <b className="num">{Math.round(n)}%</b>
        <span>de la meta</span>
      </div>
    </div>
  );
}
