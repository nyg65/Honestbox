import Link from 'next/link';
import { Shell, Flash } from '@/components/Shell.tsx';
import { listBoxes, bandsFor, boxState, settings } from '@/lib/engine.ts';
import { houseEdge } from '@/lib/fair.ts';
import { usd, oneIn } from '@/lib/money.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Boxes' };

export default async function Boxes({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = settings();
  const boxes = listBoxes().map((b) => {
    const bands = bandsFor(b.id);
    return { ...b, bands, st: boxState(b, bands, s), edge: houseEdge(bands, b.price_cents), big: bands.filter((x) => x.value_cents >= 350000).reduce((a, x) => a + x.odds_ppm, 0) };
  });
  return (
    <Shell tab="boxes">
      <div className="wrap page stack" style={{ gap: 22, maxWidth: 760 }}>
        <Flash sp={sp} />
        <div className="stack" style={{ gap: 6 }}>
          <h1 style={{ fontSize: '2.4rem' }}>Honest odds. Honest prices.</h1>
          <p className="italic muted" style={{ fontSize: '1.05rem' }}>Every value from real sales. Every house edge printed. Abe would approve.</p>
        </div>
        {boxes.map((b) => (
          <Link key={b.id} href={`/boxes/${b.slug}`} className={`boxcard ${b.slug === 'statesman' ? 'cert' : 'card'}`}>
            <span className="numeral">{b.numeral}</span>
            <span className="stack" style={{ gap: 3, flex: 1, minWidth: 0 }}>
              <span className="between"><span className="serif" style={{ fontWeight: 700, fontSize: '1.25rem' }}>{b.name}</span><span className="mono" style={{ fontSize: '1.1rem' }}>{usd(b.price_cents)}</span></span>
              <span className="muted" style={{ fontSize: '0.9rem' }}>{b.tagline}</span>
              <span className="mono brass" style={{ fontSize: '0.85rem' }}>Top {usd(b.bands[0].value_cents)} · {oneIn(b.bands[0].odds_ppm)} · $3,500+ {oneIn(b.big)} · edge {Math.round(b.edge * 100)}%</span>
              {!b.st.openable && <span className="pill" style={{ alignSelf: 'flex-start', marginTop: 4 }}>{b.st.reason}</span>}
            </span>
          </Link>
        ))}
        <Link href="/drops" className="cert between" style={{ textDecoration: 'none', color: 'var(--ivory)', background: 'var(--brass)', outlineColor: 'var(--brass)' }}>
          <span className="stack" style={{ gap: 2, color: 'var(--green)' }}><span className="eyebrow" style={{ color: 'var(--green)' }}>This week&apos;s drop</span><span className="serif" style={{ fontWeight: 700, fontSize: '1.3rem' }}>No box, no odds. Fixed honest prices.</span></span>
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>View →</span>
        </Link>
      </div>
    </Shell>
  );
}
