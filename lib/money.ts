export function usd(cents: number, opts: { cents?: boolean } = {}): string {
  const neg = cents < 0;
  const v = Math.abs(cents) / 100;
  const s = v.toLocaleString('en-US', {
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });
  return `${neg ? '−' : ''}$${s}`;
}

/** "1 in 250" style odds from parts per million. */
export function oneIn(ppm: number): string {
  if (ppm <= 0) return '—';
  const n = 1_000_000 / ppm;
  if (n < 1.5) return 'most pulls';
  return `1 in ${n >= 10 ? Math.round(n).toLocaleString('en-US') : n.toFixed(1).replace(/\.0$/, '')}`;
}

export function pct(ppm: number, digits = 1): string {
  const p = ppm / 10_000;
  return `${p.toFixed(p < 1 ? 2 : digits).replace(/\.?0+$/, '')}%`;
}

export const dollarsToCents = (s: string) => Math.round(parseFloat(String(s).replace(/[$,\s]/g, '')) * 100);
