import { TierWatchIcon } from './BoxArt.tsx';
import { tierOf, type Pocket } from '@/lib/wheel.ts';

const usd = (c: number) => `$${Math.round(c / 100).toLocaleString('en-US')}`;
export const pctOf = (ppm: number) => `${ppm >= 100_000 ? (ppm / 10_000).toFixed(0) : ppm >= 10_000 ? (ppm / 10_000).toFixed(1) : (ppm / 10_000).toFixed(2)}%`;

/** Every watch that can come out of a box, highest value first, with its odds. `hit` marks the one pulled. */
export function BoxContents({ pockets, priceCents, hit, photos }: { pockets: Pocket[]; priceCents: number; hit?: number | null; photos?: (string | null)[] }) {
  const rows = pockets.map((p, i) => ({ ...p, i })).sort((a, b) => b.valueCents - a.valueCents);
  const low = Math.min(...pockets.map((p) => p.valueCents));
  return (
    <div className="stack" style={{ gap: 10, width: '100%' }}>
      <div className="inside-head">
        <strong style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem' }}>What&apos;s inside: {pockets.length} watches</strong>
        <span className="muted" style={{ fontSize: '0.85rem' }}>Odds add up to 100%. Lowest value {usd(low)}, at least half the {usd(priceCents)} price.</span>
      </div>
      <div className="pool">
        {rows.map((p) => {
          const t = tierOf(p.valueCents).id;
          const photo = photos?.[p.i];
          return (
            <div key={p.i} className={`item t-ring-${t}${hit === p.i ? ' hit' : ''}`}>
              <span className="ic">{photo ? <img src={photo} alt="" width={36} height={36} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} loading="lazy" /> : <TierWatchIcon tier={t} />}</span>
              <span className="nm">{p.label}</span>
              <span className="vl"><b>{usd(p.valueCents)}</b><span>{pctOf(p.oddsPpm)}</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
