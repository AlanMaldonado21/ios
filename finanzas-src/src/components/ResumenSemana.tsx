import { fmtUsd } from '../../../lib/finanzas/format';
import type { ResumenSemana as R } from '../comun.d';

const fecha = (k: string) => { const [, m, d] = k.split('-').map(Number); return `${d}/${m}`; };

/** Resumen semanal: hábitos cumplidos, gastos cargados y cuánto te acercaste a la meta. Se muestra el domingo. */
export function ResumenSemana({ siempre }: { siempre?: boolean }) {
  const C = window.Comun;
  if (!C) return null;
  const hoy = new Date();
  if (!siempre && hoy.getDay() !== 0) return null;
  const r: R = C.resumenSemana();
  return <TarjetaSemana r={r} />;
}

export function TarjetaSemana({ r }: { r: R }) {
  const h = r.habitos;
  const frase = h ? window.Comun?.fraseSemana(h) : null;
  return (
    <section className="semana" aria-label="Resumen de la semana">
      <span className="rotulo">Semana del {fecha(r.desde)} al {fecha(r.hasta)}</span>
      <dl>
        {h && <div><dt>Hábitos</dt><dd>{frase}</dd></div>}
        {r.gastos && <div><dt>Gastos</dt><dd>{r.gastos.cargados === 0 ? 'No cargaste gastos.' : `Cargaste ${r.gastos.cargados} ${r.gastos.cargados === 1 ? 'gasto' : 'gastos'} en ${r.gastos.dias} ${r.gastos.dias === 1 ? 'día' : 'días'}.`}</dd></div>}
        {r.ahorro && <div><dt>Meta</dt><dd>{r.ahorro.usdSemana > 0 ? <>Separaste <span className="num">{fmtUsd(r.ahorro.usdSemana, 0)}</span>{r.ahorro.real != null && r.ahorro.meta ? <>; vas por <span className="num">{fmtUsd(r.ahorro.real, 0)}</span> de <span className="num">{fmtUsd(r.ahorro.meta, 0)}</span>.</> : '.'}</> : 'Esta semana no separaste ahorro.'}</dd></div>}
      </dl>
    </section>
  );
}
