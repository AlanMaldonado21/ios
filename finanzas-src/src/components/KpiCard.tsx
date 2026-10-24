import type { ReactNode } from 'react';
import { CountUp } from './CountUp';
import { Sparkline } from './Sparkline';
import { Ic, type IcNombre } from './Ic';

type Props = {
  label: string; ico: IcNombre; value: number; format: (n: number) => string; sub?: ReactNode;
  prev?: number | null; serie: number[]; activo: number; tono?: 'acc' | 'pos' | 'warn' | 'neg' | 'c4'; invertir?: boolean;
};

/** invertir: cuando bajar es bueno (cuotas). */
export function KpiCard({ label, ico, value, format, sub, prev, serie, activo, tono = 'acc', invertir }: Props) {
  let delta: ReactNode = <span className="delta">primer mes</span>;
  if (prev != null) {
    const d = prev === 0 ? (value === 0 ? 0 : 1) : (value - prev) / Math.abs(prev);
    const plano = Math.abs(d) < 0.005;
    const bueno = invertir ? d <= 0 : d >= 0;
    delta = (
      <span className={`delta ${plano ? '' : bueno ? 'up' : 'down'}`}>
        {plano ? '•' : d > 0 ? '▲' : '▼'} {prev === 0 && value !== 0 ? 'nuevo' : `${Math.abs(d * 100).toFixed(0)}%`}
      </span>
    );
  }
  return (
    <div className={`kpi t-${tono}`}>
      <div className="kpi-h"><span className="kpi-i"><Ic n={ico} size="s" /></span><span className="kpi-l">{label}</span></div>
      <b className="kpi-v"><CountUp value={value} format={format} ms={650} /></b>
      <div className="kpi-f">{delta}{sub && <span className="kpi-s">{sub}</span>}</div>
      <Sparkline data={serie} color={`var(--${tono})`} activo={activo} />
    </div>
  );
}
