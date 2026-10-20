import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shell, Flash } from '@/components/Shell.tsx';
import { WatchArt, artFor } from '@/components/Mark.tsx';
import { Reveal } from '@/components/Reveal.tsx';
import { requireUser } from '@/lib/auth.ts';
import { getPull, buybackQuote, settings } from '@/lib/engine.ts';
import { usd, oneIn } from '@/lib/money.ts';
import { revealAction } from '../../actions.ts';

export const dynamic = 'force-dynamic';

export default async function PullPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params; const sp = await searchParams;
  const user = await requireUser(`/pulls/${id}`);
  const p = getPull(user.id, Number(id));
  if (!p) notFound();
  const q = buybackQuote(p.market_cents, settings());
  const daysLeft = Math.max(0, Math.ceil((Date.parse(p.hold_until) - Date.now()) / 86400_000));
  const art = artFor(p.brand);
  const reveal = revealAction.bind(null, p.id);

  return (
    <Shell tab="vault">
      <div className="narrow page stack" style={{ gap: 20 }}>
        <span className="eyebrow">{p.box_name} · {usd(p.price_cents)} · pull #{p.id}</span>
        <Flash sp={sp} />
        <Reveal revealed={!!p.revealed} onReveal={reveal}>
          <div className="stack" style={{ gap: 18 }}>
            <div className="cert stack" style={{ alignItems: 'center', gap: 14, textAlign: 'center', padding: '24px 20px' }}>
              <span className="pill pill-brass">{oneIn(p.band_odds)} pull</span>
              <WatchArt size={150} dial={art.dial} bezel={art.bezel} />
              <div className="stack" style={{ gap: 4 }}>
                <h1 style={{ fontSize: '2rem' }}>{p.brand} {p.model}</h1>
                <span className="muted" style={{ fontSize: '0.9rem' }}>{[p.reference && `Ref. ${p.reference}`, p.size_mm && `${p.size_mm} mm`, p.year, p.condition, p.papers].filter(Boolean).join(' · ')}</span>
              </div>
              <div className="stack" style={{ gap: 2 }}>
                <span className="mono brass" style={{ fontSize: '1.9rem' }}>{usd(p.market_cents)}</span>
                <span className="muted" style={{ fontSize: '0.85rem' }}>
                  {p.sales_count ? `Average of ${p.sales_count} recent sales, ${usd(p.sales_low_cents!)} to ${usd(p.sales_high_cents!)}` : 'Average of recent verified sales'}
                </span>
              </div>
            </div>

            {p.status === 'vault' && (
              <div className="stack" style={{ gap: 10 }}>
                <Link href={`/pulls/${p.id}/sell`} className="btn btn-gold btn-block" style={{ justifyContent: 'space-between' }}><span>Sell it back</span><span className="mono">up to {usd(q.credit)}</span></Link>
                <Link href={`/pulls/${p.id}/ship`} className="btn btn-block" style={{ justifyContent: 'space-between' }}><span>Ship it to me</span><span className="muted" style={{ fontWeight: 400, fontSize: '0.9rem' }}>Insured, 3–5 days</span></Link>
                <Link href="/vault" className="btn btn-block" style={{ border: 0, color: 'var(--muted)' }}>Keep in my vault ({daysLeft} days left to decide)</Link>
              </div>
            )}
            {p.status === 'sold_back' && <p className="card">You sold this pull back. <Link href="/account">See your credit</Link></p>}
            {p.status === 'ship_requested' && <p className="card">Shipping requested. We will email tracking when it leaves the vault.</p>}
            {p.status === 'shipped' && <p className="card">Shipped. Check your email for tracking.</p>}

            <details className="card" style={{ fontSize: '0.85rem' }}>
              <summary style={{ cursor: 'pointer' }}>Verify this pull</summary>
              <div className="stack" style={{ gap: 6, marginTop: 10, wordBreak: 'break-all' }}>
                <span>Server seed hash: <span className="mono">{p.server_hash}</span></span>
                <span>Client seed: <span className="mono">{p.client_seed}</span> · Nonce: <span className="mono">{p.nonce}</span></span>
                <span>Roll: <span className="mono">{p.roll_ppm.toLocaleString('en-US')}</span> of 1,000,000 · Band: {p.band_label}</span>
                {p.revealed_at
                  ? <span>Server seed (revealed): <span className="mono">{p.server_seed}</span></span>
                  : <span className="muted">The server seed is revealed when you rotate your seed on the <Link href="/fair">provably fair</Link> page.</span>}
              </div>
            </details>
          </div>
        </Reveal>
      </div>
    </Shell>
  );
}
