import { useId } from 'react';

/** Mini gráfico. activo: índice del punto a resaltar (mes seleccionado). */
export function Sparkline({ data, color = 'var(--acc)', h = 34, activo }: { data: number[]; color?: string; h?: number; activo?: number }) {
  const id = useId().replace(/:/g, '');
  const w = 100;
  if (data.length < 2) return <svg className="spark" viewBox={`0 0 ${w} ${h}`} />;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 4 - ((v - min) / rng) * (h - 8)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const a = activo != null && activo >= 0 && activo < pts.length ? pts[activo] : null;
  return (
    <div className="spark-w">
      <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={1.8} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {a && <line x1={a[0]} x2={a[0]} y1={0} y2={h} stroke={color} strokeOpacity={0.35} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />}
      </svg>
      {a && <i className="spark-dot" style={{ left: `${a[0]}%`, top: a[1], background: color }} />}
    </div>
  );
}
