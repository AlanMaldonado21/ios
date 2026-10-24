import { ahorroActualUsd, mesesDelPlan, sumarMeses } from '../../../lib/finanzas/calc';
import { fmtArs, fmtUsd, mesLargo } from '../../../lib/finanzas/format';
import { useStore } from '../store';
import { MoneyInput } from '../components/MoneyInput';
import { CuentaSync } from '../components/CuentaSync';
import { SelectMes, Stepper } from '../components/Campos';

const DOLARES = [1500, 1550, 1750];

export function Config() {
  const { data, editar, setDolar } = useStore();
  const s = data.settings;
  const meses = mesesDelPlan(data);
  const total = ahorroActualUsd(data);
  const inicioOpts = Array.from({ length: 25 }, (_, i) => sumarMeses('2026-01', i));

  return (
    <div className="dash">
      <header className="ph"><div><h1>Configuración</h1><p className="sub">Tu meta y tus ahorros</p></div></header>

      <h3 className="sec">Cuenta y sincronización</h3>
      <section className="card"><CuentaSync /></section>

      <h3 className="sec">Tu meta</h3>
      <section className="card pad0">
        <div className="cfg-row"><div><b>Meta en USD</b></div>
          <MoneyInput value={s.metaUsd} prefijo="U$S" ariaLabel="Meta en dólares" onChange={n => editar(d => { d.settings.metaUsd = n; })} /></div>
        <div className="cfg-row"><div><b>Fecha de la meta</b><small>Entre {mesLargo(meses[0])} y {mesLargo(meses[meses.length - 1])}</small></div>
          <SelectMes value={s.fechaMeta} meses={meses} ariaLabel="Fecha de la meta" onChange={m => editar(d => { d.settings.fechaMeta = m; })} /></div>
        <div className="cfg-row"><div><b>Dólar estimado</b><small>Con este valor se pasan los pesos a USD</small></div>
          <MoneyInput value={s.dolar} ariaLabel="Dólar estimado" onChange={n => n > 0 && setDolar(n)} /></div>
        <div className="cfg-chips">{DOLARES.map(d => <button key={d} className={s.dolar === d ? 'on' : ''} onClick={() => setDolar(d)}>$ {d.toLocaleString('es-AR')}</button>)}</div>
      </section>

      <h3 className="sec">Lo que ya tenés ahorrado</h3>
      <section className="card pad0">
        <div className="cfg-row"><div><b>Ahorro en dólares</b></div>
          <MoneyInput value={s.ahorroUsdActual} prefijo="U$S" ariaLabel="Ahorro actual en dólares" onChange={n => editar(d => { d.settings.ahorroUsdActual = n; })} /></div>
        <div className="cfg-row"><div><b>Ahorro en pesos</b><small>Solo pesos reales, aparte de los dólares</small></div>
          <MoneyInput value={s.ahorroPesosActual} ariaLabel="Ahorro actual en pesos" onChange={n => editar(d => { d.settings.ahorroPesosActual = n; })} /></div>
        <div className="ed-total"><span>Total en USD</span><b className="num">{fmtUsd(total)}</b></div>
      </section>
      <p className="cfg-note">Los pesos se pasan a dólares a {fmtArs(s.dolar)}.</p>

      <h3 className="sec">Duración del plan</h3>
      <section className="card pad0">
        <div className="cfg-row"><div><b>Empieza en</b></div>
          <SelectMes value={s.mesInicioPlan} meses={inicioOpts} ariaLabel="Mes de inicio" onChange={m => editar(d => { d.settings.mesInicioPlan = m; })} /></div>
        <div className="cfg-row"><div><b>Cantidad de meses</b><small>Termina en {mesLargo(meses[meses.length - 1])}</small></div>
          <Stepper value={s.mesesPlan} min={1} max={60} ariaLabel="Meses del plan" onChange={n => editar(d => { d.settings.mesesPlan = n; })} /></div>
      </section>
    </div>
  );
}
