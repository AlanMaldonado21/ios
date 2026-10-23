import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { MesCalc } from '../../../lib/finanzas/calc';
import { fmtArs, fmtUsd, mesCorto, mesLargo } from '../../../lib/finanzas/format';

const eje = { fontSize: 11, fill: 'var(--mu)', fontWeight: 600 } as const;
const millones = (v: number) => (v ? `${(v / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M` : '0');

type TipRow = { name: string; value: number; color: string; fmt: (n: number) => string };
function Tip({ titulo, rows, total }: { titulo: string; rows: TipRow[]; total?: string }) {
  return (
    <div className="tip">
      <b>{titulo}</b>
      {rows.map(r => (
        <div key={r.name} className="tip-r"><i style={{ background: r.color }} />{r.name}<span className="num">{r.fmt(r.value)}</span></div>
      ))}
      {total && <div className="tip-t"><span>Total</span><span className="num">{total}</span></div>}
    </div>
  );
}

type Sel = { sel: string; onSel: (m: string) => void };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clickMes = (onSel: (m: string) => void) => (e: any) => { if (e?.activeLabel) onSel(String(e.activeLabel)); };

/** USD acumulados vs meta, con marca en la fecha de la meta y el mes elegido. */
export function AcumuladoChart({ meses, meta, fechaMeta, sel, onSel }: { meses: MesCalc[]; meta: number; fechaMeta: string } & Sel) {
  const s = meses.find(m => m.mes === sel);
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={meses} margin={{ top: 18, right: 10, left: -10, bottom: 0 }} onClick={clickMes(onSel)}>
        <defs>
          <linearGradient id="gAcum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acc)" stopOpacity={0.42} />
            <stop offset="100%" stopColor="var(--acc)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--ln)" />
        <XAxis dataKey="mes" tickFormatter={mesCorto} tick={eje} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
        <YAxis tick={eje} axisLine={false} tickLine={false} width={44} tickFormatter={v => `${Math.round(v / 1000)}k`} />
        <ReferenceLine y={meta} stroke="var(--pos)" strokeDasharray="5 5" strokeWidth={1.5}
          label={{ value: `Meta ${fmtUsd(meta, 0)}`, position: 'insideTopLeft', fill: 'var(--pos)', fontSize: 11, fontWeight: 800 }} />
        <ReferenceLine x={fechaMeta} stroke="var(--mu)" strokeDasharray="2 4"
          label={{ value: '🎯', position: 'top', fontSize: 13 }} />
        <Tooltip cursor={{ stroke: 'var(--mu)', strokeDasharray: '3 3' }}
          content={({ active, payload, label }) => active && payload?.length ? (
            <Tip titulo={mesLargo(String(label))} rows={[{ name: 'Acumulado', value: Number(payload[0].value), color: 'var(--acc)', fmt: n => fmtUsd(n) }]} />
          ) : null} />
        <Area type="monotone" dataKey="usdAcumulados" stroke="var(--acc)" strokeWidth={2.5} fill="url(#gAcum)"
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }} animationDuration={900} />
        {s && <ReferenceDot x={s.mes} y={s.usdAcumulados} r={6} fill="var(--acc)" stroke="var(--card)" strokeWidth={3} />}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export const SERIES = [
  { key: 'ahorroPesos', name: 'Ahorro', color: 'var(--acc)' },
  { key: 'cuotas', name: 'Cuotas', color: 'var(--warn)' },
  { key: 'gastos', name: 'Gastos', color: 'var(--c4)' },
  { key: 'libre', name: 'Libre', color: 'var(--pos)' },
] as const;

/** Barras apiladas por mes. Tocá una barra para abrir ese mes. */
export function ApiladoChart({ meses, sel, onSel }: { meses: MesCalc[] } & Sel) {
  const rows = meses.map(d => ({ ...d, libre: Math.max(0, d.libre) }));
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={rows} margin={{ top: 8, right: 4, left: -14, bottom: 0 }} barCategoryGap="20%" onClick={clickMes(onSel)}>
        <CartesianGrid vertical={false} stroke="var(--ln)" />
        <XAxis dataKey="mes" tickFormatter={mesCorto} tick={eje} axisLine={false} tickLine={false} minTickGap={6} />
        <YAxis tick={eje} axisLine={false} tickLine={false} width={44} tickFormatter={millones} />
        <Tooltip cursor={{ fill: 'var(--hover)' }}
          content={({ active, payload, label }) => active && payload?.length ? (
            <Tip titulo={mesLargo(String(label))} rows={payload.map(p => ({ name: String(p.name), value: Number(p.value), color: String(p.color), fmt: fmtArs }))}
              total={fmtArs(meses.find(m => m.mes === label)?.ingresoTotal ?? 0)} />
          ) : null} />
        {SERIES.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a" fill={s.color} radius={i === SERIES.length - 1 ? [6, 6, 0, 0] : 0} animationDuration={700}>
            {rows.map(r => <Cell key={r.mes} fillOpacity={r.mes === sel ? 1 : r.hastaMeta ? 0.55 : 0.22} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

const TARJETAS = [
  { key: 'BNA Visa', color: 'var(--warn)' },
  { key: 'MercadoPago', color: 'var(--c5)' },
];

/** Cuotas por mes y por tarjeta: barras que se van achicando. */
export function CuotasChart({ meses, sel, onSel }: { meses: MesCalc[] } & Sel) {
  const rows = meses.map(m => {
    const r: Record<string, number | string> = { mes: m.mes };
    for (const t of TARJETAS) r[t.key] = m.cuotasDetalle.filter(c => c.tarjeta === t.key).reduce((a, c) => a + c.monto, 0);
    return r;
  });
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={rows} margin={{ top: 10, right: 4, left: -14, bottom: 0 }} onClick={clickMes(onSel)} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke="var(--ln)" />
        <XAxis dataKey="mes" tickFormatter={mesCorto} tick={eje} axisLine={false} tickLine={false} minTickGap={6} />
        <YAxis tick={eje} axisLine={false} tickLine={false} width={44} tickFormatter={v => (v ? `${Math.round(v / 1000)}k` : '0')} />
        <Tooltip cursor={{ fill: 'var(--hover)' }}
          content={({ active, payload, label }) => active && payload?.length ? (
            <Tip titulo={mesLargo(String(label))} rows={payload.filter(p => Number(p.value) > 0).map(p => ({ name: String(p.name), value: Number(p.value), color: String(p.color), fmt: fmtArs }))} />
          ) : null} />
        {TARJETAS.map((t, i) => (
          <Bar key={t.key} dataKey={t.key} name={t.key} stackId="c" fill={t.color} radius={i === TARJETAS.length - 1 ? [6, 6, 0, 0] : 0} animationDuration={700}>
            {rows.map(r => <Cell key={String(r.mes)} fillOpacity={!sel || r.mes === sel ? 1 : 0.6} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
export { TARJETAS };

/** Dona: en qué se va el ingreso del mes. */
export function DonaChart({ partes, centro, label }: { partes: { name: string; value: number; color: string }[]; centro: string; label: string }) {
  const visibles = partes.filter(p => p.value > 0);
  return (
    <div className="dona-g">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={visibles} dataKey="value" innerRadius="72%" outerRadius="100%" paddingAngle={2.5} cornerRadius={5} stroke="none"
            startAngle={90} endAngle={-270} animationDuration={700} isAnimationActive>
            {visibles.map(p => <Cell key={p.name} fill={p.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="dona-c"><span>{label}</span><b className="num">{centro}</b></div>
    </div>
  );
}
