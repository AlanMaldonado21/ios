import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { fmtArs, fmtUsd, mesCorto, mesLargo } from '../../../lib/finanzas/format';

const eje = { fontSize: 11, fill: 'var(--mu)', fontWeight: 600 } as const;

type TipRow = { name: string; value: number; color: string; fmt: (n: number) => string };
function Tip({ titulo, rows }: { titulo: string; rows: TipRow[] }) {
  return (
    <div className="tip">
      <b>{titulo}</b>
      {rows.map(r => (
        <div key={r.name} className="tip-r"><i style={{ background: r.color }} />{r.name}<span className="num">{r.fmt(r.value)}</span></div>
      ))}
    </div>
  );
}

/** USD acumulados vs meta, con marca en la fecha de la meta. */
export function AcumuladoChart({ data, meta, fechaMeta }: { data: { mes: string; usdAcum: number }[]; meta: number; fechaMeta: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gAcum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acc)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--acc)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--ln)" strokeDasharray="0" />
        <XAxis dataKey="mes" tickFormatter={mesCorto} tick={eje} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
        <YAxis tick={eje} axisLine={false} tickLine={false} width={44} tickFormatter={v => `${Math.round(v / 1000)}k`} />
        <ReferenceLine y={meta} stroke="var(--pos)" strokeDasharray="5 5" strokeWidth={1.5}
          label={{ value: `Meta ${fmtUsd(meta, 0)}`, position: 'insideTopLeft', fill: 'var(--pos)', fontSize: 11, fontWeight: 700 }} />
        <ReferenceLine x={fechaMeta} stroke="var(--mu)" strokeDasharray="2 4"
          label={{ value: 'fecha meta', position: 'insideBottomRight', fill: 'var(--mu)', fontSize: 10, fontWeight: 700, offset: 6 }} />
        <Tooltip cursor={{ stroke: 'var(--mu)', strokeDasharray: '3 3' }}
          content={({ active, payload, label }) => active && payload?.length ? (
            <Tip titulo={mesLargo(String(label))} rows={[{ name: 'Acumulado', value: Number(payload[0].value), color: 'var(--acc)', fmt: n => fmtUsd(n) }]} />
          ) : null} />
        <Area type="monotone" dataKey="usdAcum" stroke="var(--acc)" strokeWidth={2.5} fill="url(#gAcum)"
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }} animationDuration={1100} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export const SERIES = [
  { key: 'ahorroPesos', name: 'Ahorro', color: 'var(--acc)' },
  { key: 'cuotas', name: 'Cuotas', color: 'var(--warn)' },
  { key: 'gastos', name: 'Gastos fijos', color: 'var(--c4)' },
  { key: 'libre', name: 'Libre', color: 'var(--pos)' },
] as const;

/** Barras apiladas: en qué se reparte el ingreso de cada mes. */
export function ApiladoChart({ data }: { data: { mes: string; postMeta: boolean; libre: number; ahorroPesos: number; cuotas: number; gastos: number }[] }) {
  const rows = data.map(d => ({ ...d, libre: Math.max(0, d.libre) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 8, right: 4, left: -6, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke="var(--ln)" />
        <XAxis dataKey="mes" tickFormatter={mesCorto} tick={eje} axisLine={false} tickLine={false} minTickGap={8} />
        <YAxis tick={eje} axisLine={false} tickLine={false} width={40} tickFormatter={v => v ? `${(v / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M` : '0'} />
        <Tooltip cursor={{ fill: 'var(--hover)' }}
          content={({ active, payload, label }) => active && payload?.length ? (
            <Tip titulo={mesLargo(String(label))} rows={payload.map(p => ({ name: String(p.name), value: Number(p.value), color: String(p.color), fmt: fmtArs }))} />
          ) : null} />
        {SERIES.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a" fill={s.color} radius={i === SERIES.length - 1 ? [6, 6, 0, 0] : 0}>
            {rows.map(r => <Cell key={String(r.mes)} fillOpacity={r.postMeta ? 0.35 : 1} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Cuotas por mes: barras que se achican hasta desaparecer. */
export function CuotasChart({ data }: { data: { mes: string; cuotas: number }[] }) {
  return (
    <div className="cuo-g"><ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 18, right: 4, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="gCuo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--warn)" />
            <stop offset="100%" stopColor="var(--warn)" stopOpacity={0.45} />
          </linearGradient>
        </defs>
        <XAxis dataKey="mes" tickFormatter={mesCorto} tick={eje} axisLine={false} tickLine={false} minTickGap={8} />
        <YAxis hide />
        <Tooltip cursor={{ fill: 'var(--hover)' }}
          content={({ active, payload, label }) => active && payload?.length ? (
            <Tip titulo={mesLargo(String(label))} rows={[{ name: 'Cuotas', value: Number(payload[0].value), color: 'var(--warn)', fmt: fmtArs }]} />
          ) : null} />
        <Bar dataKey="cuotas" fill="url(#gCuo)" radius={[8, 8, 3, 3]} minPointSize={3} animationDuration={900}>
          {data.map(d => <Cell key={d.mes} fill={d.cuotas > 0 ? 'url(#gCuo)' : 'var(--track)'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer></div>
  );
}

/** Dona: en qué se va el ingreso del mes. */
export function DonaChart({ partes, centro }: { partes: { name: string; value: number; color: string }[]; centro: string }) {
  const visibles = partes.filter(p => p.value > 0);
  return (
    <div className="dona">
      <div className="dona-g">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={visibles} dataKey="value" innerRadius="70%" outerRadius="100%" paddingAngle={2} cornerRadius={6} stroke="none" startAngle={90} endAngle={-270} animationDuration={900}>
              {visibles.map(p => <Cell key={p.name} fill={p.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="dona-c"><span>Ingreso</span><b className="num">{centro}</b></div>
      </div>
    </div>
  );
}

