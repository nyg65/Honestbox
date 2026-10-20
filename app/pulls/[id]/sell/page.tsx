import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Shell, Flash } from '@/components/Shell.tsx';
import { requireUser } from '@/lib/auth.ts';
import { getPull, buybackQuote, settings, num, valueBasis } from '@/lib/engine.ts';
import { usd } from '@/lib/money.ts';
import { sellBackAction } from '../../../actions.ts';

export const dynamic = 'force-dynamic';

export default async function Sell({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params; const sp = await searchParams;
  const user = await requireUser(`/pulls/${id}/sell`);
  const p = getPull(user.id, Number(id));
  if (!p) notFound();
  if (p.status !== 'vault') redirect(`/pulls/${id}`);
  const s = settings();
  const q = buybackQuote(valueBasis(p), s);
  const needsId = q.cash > num(s, 'cash_id_threshold_cents') && !user.id_verified;

  return (
    <Shell tab="vault">
      <div className="narrow page stack" style={{ gap: 20 }}>
        <Link href={`/pulls/${id}`} className="muted" style={{ textDecoration: 'none' }}>← Back to your pull</Link>
        <span className="eyebrow">Buyback offer</span>
        <div className="stack" style={{ gap: 4 }}>
          <h1 style={{ fontSize: '2.1rem' }}>{p.brand} {p.model}</h1>
          <span className="muted">Pulled from {p.box_name}</span>
        </div>
        <Flash sp={sp} />
        <div className="cert stack" style={{ gap: 10 }}>
          <span className="italic brass">The honest math, in full</span>
          <div className="between"><span className="muted">Value when you pulled it</span><span className="mono">{usd(p.value_cents)}</span></div>
          <div className="between"><span className="muted">Market value today</span><span className="mono">{usd(p.market_cents)}</span></div>
          {p.locked_cents != null && <div className="between"><span className="muted">Your locked value</span><span className="mono brass">{usd(p.locked_cents)}</span></div>}
          <div className="between"><span className="muted">Buyback is based on</span><span className="mono">{p.locked_cents != null ? 'locked value' : "today's value"}</span></div>
          {p.sales_count > 0 && <div className="between"><span className="muted">Recent sales range</span><span className="mono">{usd(p.sales_low_cents!)} – {usd(p.sales_high_cents!)}</span></div>}
          {p.sales_count > 0 && <div className="between"><span className="muted">Sales used</span><span className="mono">{p.sales_count}</span></div>}
        </div>
        <form action={sellBackAction} className="stack" style={{ gap: 12 }}>
          <input type="hidden" name="pull" value={p.id} />
          <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 10 }}>
            <legend className="eyebrow" style={{ marginBottom: 10 }}>How do you want to be paid?</legend>
            <label className="card between" style={{ cursor: 'pointer', color: 'var(--ivory)', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' }}>
              <span className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                <input type="radio" name="method" value="credit" defaultChecked style={{ width: 20, minHeight: 20, accentColor: 'var(--brass)' }} />
                <span className="stack" style={{ gap: 2 }}><span style={{ fontWeight: 600 }}>HonestBox credit</span><span className="muted" style={{ fontSize: '0.85rem' }}>{q.creditBp / 100}% of value · instant</span></span>
              </span>
              <span className="mono" style={{ fontSize: '1.3rem' }}>{usd(q.credit)}</span>
            </label>
            <label className="card between" style={{ cursor: needsId ? 'not-allowed' : 'pointer', color: 'var(--ivory)', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', opacity: needsId ? 0.55 : 1 }}>
              <span className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                <input type="radio" name="method" value="cash" disabled={needsId} style={{ width: 20, minHeight: 20, accentColor: 'var(--brass)' }} />
                <span className="stack" style={{ gap: 2 }}><span style={{ fontWeight: 600 }}>Cash to your bank</span><span className="muted" style={{ fontSize: '0.85rem' }}>{q.cashBp / 100}% of value · reviewed, then 1–2 business days{needsId ? ' · needs a verified ID' : ''}</span></span>
              </span>
              <span className="mono" style={{ fontSize: '1.3rem' }}>{usd(q.cash)}</span>
            </label>
          </fieldset>
          <p className="muted" style={{ fontSize: '0.85rem' }}>The watch goes back into the vault and back into its band, so the published odds stay fully stocked.</p>
          <button className="btn btn-gold btn-block">Sell it back</button>
        </form>
      </div>
    </Shell>
  );
}
