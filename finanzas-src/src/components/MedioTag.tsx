import { MEDIOS, type Medio } from '../../../lib/finanzas/diario';
import { Ic } from './Ic';

/** Etiqueta del medio de pago. Contado: relleno tinta · Crédito: borde terracota · Transferencia: borde punteado. */
export function MedioTag({ medio, children }: { medio: Medio; children?: React.ReactNode }) {
  const m = MEDIOS.find(x => x.id === medio)!;
  return <span className={`medio m-${medio}`}><Ic n={m.ico} size="s" />{children ?? m.label}</span>;
}
