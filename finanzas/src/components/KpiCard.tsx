import type { ReactNode } from 'react';
import { CountUp } from './CountUp';
import { Sparkline } from './Sparkline';

type Props = {
  label: string; value: number; format: (n: number) => string;
  prev?: number | null; serie: number[]; tono?: 'acc' | 'pos' | 'warn' | 'neg' | 'c4'; invertir?: boolean; nota?: string;
};

/** invertir: cuando bajar es bueno (cuotas). */
export function KpiCard({ label, value, format, prev, serie, tono = 'acc', invertir, nota }: Props) {
  let delta: ReactNode = null;
  if (prev != null && prev !== 0) {
    const d = (value - prev) / Math.abs(prev);
    const bueno = invertir ? d <= 0 : d >= 0;
    delta = (
      <span className={`delta ${Math.abs(d) < 0.005 ? '' : bueno ? 'up' : 'down'}`}>
        {d > 0.005 ? '▲' : d < -0.005 ? '▼' : '•'} {Math.abs(d * 100).toFixed(0)}%
      </span>
    );
  } else if (prev === 0 && value === 0) delta = <span className="delta">• 0%</span>;
  return (
    <div className={`kpi t-${tono}`}>
      <span className="kpi-l">{label}</span>
      <b className="kpi-v"><CountUp value={value} format={format} /></b>
      <div className="kpi-f">
        {delta ?? <span className="delta">{nota ?? 'primer mes'}</span>}
        <span className="kpi-vs">vs mes anterior</span>
      </div>
      <Sparkline data={serie} color={`var(--${tono})`} />
    </div>
  );
}
