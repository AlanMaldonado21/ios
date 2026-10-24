/** Ícono de línea (Lucide) desde el sprite compartido ui/icons.svg. Decorativo salvo que se pase `label`. */
export type IcNombre =
  | 'house' | 'notebook-pen' | 'calendar-range' | 'ellipsis' | 'plus' | 'sun' | 'chart-no-axes-column' | 'list-checks' | 'wallet'
  | 'settings' | 'eye' | 'eye-off' | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'x' | 'check' | 'trash-2' | 'calendar'
  | 'landmark' | 'credit-card' | 'receipt' | 'calendar-days' | 'arrow-left-right' | 'banknote' | 'refresh-cw' | 'cloud' | 'cloud-off'
  | 'triangle-alert' | 'pencil' | 'flag' | 'clock' | 'folder' | 'award' | 'download' | 'upload' | 'circle-check' | 'milestone' | 'undo-2'
  | 'log-out' | 'target' | 'utensils' | 'shopping-cart' | 'beer' | 'car-taxi-front' | 'bike' | 'pill' | 'shirt' | 'package' | 'tag';

export function Ic({ n, size, label, className = '' }: { n: IcNombre; size?: 's' | 'l'; label?: string; className?: string }) {
  return (
    <svg className={`ic ${size ?? ''} ${className}`} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      <use href={`../ui/icons.svg#i-${n}`} />
    </svg>
  );
}
