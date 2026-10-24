import { Ic, type IcNombre } from '../components/Ic';

const ITEMS: { h: string; i: IcNombre; t: string; d: string }[] = [
  { h: '#/mes', i: 'calendar-days', t: 'Detalle del mes', d: 'Ahorro, reparto y apertura' },
  { h: '#/ingresos', i: 'landmark', t: 'Ingresos', d: 'Sueldo, fijos y comisión' },
  { h: '#/cuotas', i: 'credit-card', t: 'Cuotas', d: 'Lo que debés con tarjeta' },
  { h: '#/gastos', i: 'receipt', t: 'Gastos fijos', d: 'Servicios y suscripciones' },
  { h: '#/config', i: 'settings', t: 'Configuración', d: 'Meta, dólar, cuenta y sincronización' },
];

/** Lo que se toca una vez por mes, fuera de la barra de abajo. El cambio a Hábitos está arriba, en el switch. */
export function Mas() {
  return (
    <div className="dash">
      <header className="ph"><div><h1>Más</h1></div></header>
      <ul className="lista">
        {ITEMS.map(x => (
          <li key={x.h}><a href={x.h} className="mas-i"><Ic n={x.i} /><span><b>{x.t}</b><small>{x.d}</small></span><Ic n="chevron-right" size="s" /></a></li>
        ))}
      </ul>
    </div>
  );
}
