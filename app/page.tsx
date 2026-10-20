import Link from 'next/link';
import { Shell } from '@/components/Shell.tsx';
import { Mark } from '@/components/Mark.tsx';
import { listBoxes, bandsFor, currentDrop, buybackQuote, settings } from '@/lib/engine.ts';
import { expectedValueCents, houseEdge } from '@/lib/fair.ts';
import { usd, oneIn } from '@/lib/money.ts';

export const dynamic = 'force-dynamic';

export default async function Landing() {
  const s = settings();
  const boxes = listBoxes().map((b) => {
    const bands = bandsFor(b.id);
    const big = bands.filter((x) => x.value_cents >= 350000).reduce((a, x) => a + x.odds_ppm, 0);
    return { ...b, bands, top: bands[0], ev: expectedValueCents(bands), edge: houseEdge(bands, b.price_cents), big };
  });
  const featured = boxes.find((b) => b.slug === 'statesman') || boxes[0];
  const drop = currentDrop();
  const lead = drop?.items.find((i) => i.item_status !== 'sold') || drop?.items[0];
  const q = buybackQuote(100, s);

  return (
    <Shell>
      <section className="wrap" style={{ paddingBlock: '72px 88px', display: 'flex', flexWrap: 'wrap', gap: 56, alignItems: 'center' }}>
        <div className="stack" style={{ flex: '1 1 520px', minWidth: 0, gap: 22 }}>
          <span className="eyebrow">Luxury watches · published odds · fair buybacks</span>
          <h1 className="big" style={{ fontSize: '4rem', lineHeight: 1.02 }}>The honest way to collect luxury watches.</h1>
          <p className="muted" style={{ fontSize: '1.15rem', lineHeight: 1.6, maxWidth: '34rem' }}>
            Open a box and reveal an authenticated watch, from Seiko to Rolex. Every value comes from real recent sales,
            every house edge is printed on the box, and every pull can be sold back at a fair price.
          </p>
          <div className="row" style={{ gap: 14, paddingTop: 6 }}>
            <Link href="/boxes" className="btn btn-gold">Open your first box</Link>
            <Link href="/drops" className="btn">See this week&apos;s drop</Link>
          </div>
          <p className="italic brass" style={{ fontSize: '1.05rem' }}>Named for the man they called Honest Abe.</p>
        </div>
        <div style={{ flex: '1 1 380px', minWidth: 0, position: 'relative', display: 'flex', justifyContent: 'center', paddingBottom: 70 }}>
          <Mark size={360} detail />
          {featured && (
            <div className="cert stack" style={{ position: 'absolute', left: 0, bottom: 0, gap: 4, minWidth: 250, padding: '14px 18px' }}>
              <span className="serif" style={{ fontWeight: 700, fontSize: '1.2rem' }}>{featured.name} · {usd(featured.price_cents)}</span>
              <span className="muted" style={{ fontSize: '0.85rem' }}>Top pull: {featured.top?.label}</span>
              <span className="mono brass" style={{ fontSize: '0.9rem' }}>{usd(featured.top.value_cents)} · {oneIn(featured.top.odds_ppm)} · edge {Math.round(featured.edge * 100)}%</span>
            </div>
          )}
        </div>
      </section>

      <section style={{ background: 'var(--deep)', borderBlock: '1px solid var(--rule)' }}>
        <div className="wrap stack" style={{ paddingBlock: 64, gap: 36 }}>
          <h2 style={{ fontSize: '2.5rem' }}>Three promises Abe would sign.</h2>
          <div className="grid">
            {[
              ['Prices from real sales', 'Every watch is valued at the average of recent verified sales, with the sales listed. No inflated retail prices.'],
              ['Every edge printed', `Each box shows its odds, its expected value and its house edge before you open it. Ours is ${Math.round(featured.edge * 100)}%, and we say so.`],
              ['A fair buyback, any pull', `Don't want what you pulled? Sell it back for ${q.credit}% of market value in credit or ${q.cash}% in cash.`],
            ].map(([h, p]) => (
              <div key={h} className="stack" style={{ gap: 10, borderTop: '2px solid var(--brass)', paddingTop: 18 }}>
                <h3 style={{ fontSize: '1.45rem' }}>{h}</h3>
                <p className="muted" style={{ lineHeight: 1.6 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap stack" style={{ paddingBlock: 72, gap: 32 }}>
        <div className="between">
          <h2 style={{ fontSize: '2.5rem' }}>The boxes</h2>
          <span className="muted">Full odds on every box page.</span>
        </div>
        <div className="grid">
          {boxes.map((b) => (
            <Link key={b.id} href={`/boxes/${b.slug}`} className={b.slug === featured.slug ? 'cert stack' : 'card stack'} style={{ textDecoration: 'none', color: 'var(--ivory)', gap: 14 }}>
              <span className="eyebrow" style={{ color: b.slug === featured.slug ? 'var(--brass)' : 'var(--muted)' }}>Box {b.numeral}</span>
              <div className="between"><span className="serif" style={{ fontWeight: 700, fontSize: '1.6rem' }}>{b.name}</span><span className="mono" style={{ fontSize: '1.25rem' }}>{usd(b.price_cents)}</span></div>
              <hr className="rule" />
              <div className="between"><span className="muted">Top pull</span><span className="mono">{usd(b.top.value_cents)} · {oneIn(b.top.odds_ppm)}</span></div>
              <div className="between"><span className="muted">$3,500 or more</span><span className="mono">{oneIn(b.big)}</span></div>
              <div className="between"><span className="muted">Expected value</span><span className="mono">{usd(b.ev)}</span></div>
            </Link>
          ))}
        </div>
      </section>

      {lead && (
        <section style={{ background: 'var(--brass)', color: 'var(--green)' }}>
          <div className="wrap" style={{ paddingBlock: 64, display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stack" style={{ flex: '1 1 460px', gap: 12 }}>
              <span className="eyebrow" style={{ color: 'var(--green)' }}>{drop!.title}</span>
              <h2 style={{ fontSize: '2.6rem' }}>{lead.brand} {lead.model}{lead.reference ? `, ref. ${lead.reference}` : ''}</h2>
              <p style={{ fontSize: '1.1rem', maxWidth: '34rem' }}>No box, no odds. Curated pieces at fixed prices, set at or under the average of recent sales.</p>
            </div>
            <div className="stack" style={{ flex: '0 1 320px', gap: 12 }}>
              <div className="between" style={{ borderBottom: '1px solid var(--green)', paddingBottom: 10 }}><span>Honest price</span><span className="mono" style={{ fontSize: '1.6rem' }}>{usd(lead.price_cents)}</span></div>
              <div className="between"><span>Recent sales average</span><span className="mono">{usd(lead.market_cents)}</span></div>
              <Link href="/drops" className="btn" style={{ background: 'var(--green)', color: 'var(--ivory)', borderColor: 'var(--green)' }}>View the drop</Link>
            </div>
          </div>
        </section>
      )}

      <section className="wrap" style={{ paddingBlock: 72, display: 'flex', flexWrap: 'wrap', gap: 40 }}>
        <div className="stack" style={{ flex: '1 1 360px' }}>
          <h2 style={{ fontSize: '2.5rem' }}>The Honest Ledger</h2>
          <p className="muted" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>Every pull counted against the published odds, every buyback we paid, live. And every pull can be re-checked with our provably fair math.</p>
          <div className="row"><Link href="/ledger" className="btn">Read the ledger</Link><Link href="/fair">How provably fair works</Link></div>
        </div>
        <figure className="stack" style={{ flex: '1 1 420px', margin: 0, justifyContent: 'center', gap: 14 }}>
          <blockquote className="italic" style={{ margin: 0, fontSize: '2.1rem', lineHeight: 1.25 }}>“Let us have faith that right makes might.”</blockquote>
          <figcaption className="eyebrow">Abraham Lincoln · Cooper Union, 1860</figcaption>
        </figure>
      </section>
    </Shell>
  );
}
