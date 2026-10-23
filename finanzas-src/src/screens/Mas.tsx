const ITEMS = [
  { h: '#/ingresos', i: '💵', t: 'Ingresos', d: 'Sueldo, fijos y comisión' },
  { h: '#/cuotas', i: '💳', t: 'Cuotas', d: 'Lo que debés con tarjeta' },
  { h: '#/gastos', i: '🏠', t: 'Gastos fijos', d: 'Alquiler, servicios, suscripciones' },
  { h: '#/mes', i: '📅', t: 'Detalle del mes', d: 'Ahorro, reparto y apertura' },
  { h: '#/config', i: '⚙️', t: 'Configuración', d: 'Dólar, meta, mes de inicio' },
  { h: '../', i: '🔥', t: 'Hábitos', d: 'Volver al tracker' },
];

/** Todo lo que se toca una vez por mes, fuera de la barra de abajo. */
export function Mas() {
  return (
    <div className="dash">
      <header className="ph ph-sm"><div><h1>Más</h1></div></header>
      <section className="card pad0">
        {ITEMS.map(x => (
          <a key={x.h} href={x.h} className="mas-i"><span className="gd-i">{x.i}</span><div><b>{x.t}</b><small>{x.d}</small></div><i aria-hidden>›</i></a>
        ))}
      </section>
    </div>
  );
}
