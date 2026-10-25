import { fmtPct, fmtUsd, hayMascara } from '../../../lib/finanzas/format';
import { CountUp } from './CountUp';
import { Ic } from './Ic';

/** Hitos del camino a la meta (1.500, 3.000, 5.000… meta). Se marcan solo cuando el ahorro REAL los cruzó. */
export function caminoAhorro(meta: number): number[] {
  if (window.Comun) return window.Comun.caminoAhorro(meta);
  return meta > 0 ? [meta] : [];
}
const corto = (n: number) => (hayMascara() ? '***' : n >= 1000 ? `${(n / 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}k` : String(n));

/** Pieza principal: ahorrado de verdad contra la meta. La proyección no se mezcla acá. */
export function MetaAhorro({ real, meta, fecha, compacto }: { real: number; meta: number; fecha?: string; compacto?: boolean }) {
  if (!(meta > 0)) {
    return (
      <section className="meta">
        <span className="rotulo">Meta de ahorro</span>
        <p className="mu" style={{ margin: '8px 0 0' }}>Todavía no pusiste una meta. <a href="#/config">Ponela en Configuración</a>.</p>
      </section>
    );
  }
  const p = Math.max(0, real / meta);
  const camino = caminoAhorro(meta);
  const prox = camino.find(v => real < v);
  return (
    <section className="meta" aria-label="Meta de ahorro">
      <span className="meta-deco" aria-hidden>🐷</span>
      <span className="rotulo">Ahorrado de verdad{fecha ? ` · meta ${fecha}` : ''}</span>
      <div className="meta-n">
        <b className="cifra"><CountUp value={real} format={n => fmtUsd(n, 0)} /></b>
        <span className="mu">de <span className="num">{fmtUsd(meta, 0)}</span> · <span className="num">{hayMascara() ? '**%' : fmtPct(Math.min(p, 9.99))}</span></span>
      </div>
      <div className="regla" role="progressbar" aria-label="Ahorro real sobre la meta" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, p) * 100)}>
        <i style={{ width: `${Math.min(100, p * 100)}%` }} />
        {camino.slice(0, -1).map(v => <em key={v} style={{ left: `${(v / meta) * 100}%` }} className={real >= v ? 'hecho' : ''} />)}
      </div>
      {!compacto && (
        <ol className="camino" aria-label="Hitos de ahorro">
          {camino.map(v => (
            <li key={v} className={real >= v ? 'hecho' : v === prox ? 'prox' : ''}>
              {real >= v ? <Ic n="check" size="s" label="cruzado" /> : <span className="punto" aria-hidden />}
              <span className="num">U$S {corto(v)}</span>
            </li>
          ))}
        </ol>
      )}
      {prox && <p className="meta-prox">Próximo hito: <b className="num">{fmtUsd(prox, 0)}</b> · faltan <span className="num">{fmtUsd(prox - real, 0)}</span></p>}
      {!prox && <p className="meta-prox ok">Meta cumplida con ahorro real.</p>}
    </section>
  );
}
