import { useEffect, useRef, useState } from 'react';

/** Número que cuenta desde el valor anterior hasta el nuevo. */
export function useCountUp(value: number, ms = 900) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now(), a = from.current, b = value;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      const cur = a + (b - a) * e;
      setV(cur);
      from.current = cur;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return v;
}

export function CountUp({ value, format, ms }: { value: number; format: (n: number) => string; ms?: number }) {
  const v = useCountUp(value, ms);
  return <span className="num">{format(v)}</span>;
}
