export function usd(cents: number, opts: { cents?: boolean } = {}): string {
  const neg = cents < 0;
  const v = Math.abs(cents) / 100;
  const s = v.toLocaleString('en-US', { minimumFractionDigits: opts.cents ? 2 : 0, maximumFractionDigits: opts.cents ? 2 : 0 });
  return `${neg ? '−' : ''}$${s}`;
}

export function oneIn(ppm: number): string {
  if (ppm <= 0) return '—';
  if (ppm >= 500_000) return 'most pulls';
  const n = 1_000_000 / ppm;
  return `1 in ${n >= 10 ? Math.round(n).toLocaleString('en-US') : n.toFixed(1).replace(/\.0$/, '')}`;
}

export function pct(ppm: number): string {
  const p = ppm / 10_000;
  return `${p.toFixed(p < 1 ? 2 : 1).replace(/\.?0+$/, '')}%`;
}

export function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));
}

export function timeLeft(iso: string): string {
  const ms = Date.parse(iso) - Date.now();
  if (ms <= 0) return 'Ended';
  const d = Math.floor(ms / 86_400_000), h = Math.floor((ms % 86_400_000) / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
  return d > 0 ? `Ends in ${d}d ${h}h` : `Ends in ${h}h ${m}m`;
}
