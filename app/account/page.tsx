import Link from 'next/link';
import { Shell, Flash } from '@/components/Shell.tsx';
import { requireUser } from '@/lib/auth.ts';
import { headers } from 'next/headers';
import { balance, settings, flag, num } from '@/lib/engine.ts';
import { affiliateSummary } from '@/lib/affiliate.ts';
import { db } from '@/lib/db.ts';
import { usd } from '@/lib/money.ts';
import { addTestCreditAction, signOutAction } from '../actions.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Account' };

export default async function Account({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const user = await requireUser('/account');
  const s = settings();
  const aff = affiliateSummary(user.id);
  const h = await headers();
  const host = `${h.get('x-forwarded-proto') || 'http'}://${h.get('host') || 'honestbox.com'}`;
  const rows = db().prepare('SELECT * FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(user.id) as { id: number; kind: string; amount_cents: number; memo: string; created_at: string }[];
  const payouts = db().prepare(`SELECT bb.*, w.brand, w.model FROM buybacks bb JOIN pulls p ON p.id = bb.pull_id JOIN watches w ON w.id = p.watch_id
    WHERE bb.user_id = ? AND bb.method = 'cash' ORDER BY bb.id DESC`).all(user.id) as { id: number; amount_cents: number; status: string; brand: string; model: string }[];

  return (
    <Shell tab="account">
      <div className="wrap page stack" style={{ gap: 24, maxWidth: 760 }}>
        <Flash sp={sp} />
        <div className="between" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ gap: 4 }}><h1 style={{ fontSize: '2.4rem' }}>{user.name}</h1><span className="muted">{user.email} · {user.state} · ID {user.id_verified ? 'verified' : 'not verified'}</span></div>
          <form action={signOutAction}><button className="btn btn-small">Sign out</button></form>
        </div>

        <div className="cert stack" style={{ gap: 12 }}>
          <div className="between"><span className="muted">HonestBox credit</span><span className="mono" style={{ fontSize: '2rem' }}>{usd(balance(user.id), { cents: true })}</span></div>
          {!flag(s, 'real_money') ? (
            <form action={addTestCreditAction} className="row">
              <span className="muted" style={{ fontSize: '0.9rem' }}>Test mode. Add pretend credit to try the app:</span>
              {[50000, 100000, 250000].map((c) => <button key={c} name="cents" value={c} className="btn btn-small">{usd(c)}</button>)}
            </form>
          ) : (
            <p className="muted">Adding credit with a card opens once our payment processor is connected.</p>
          )}
        </div>

        <section className="card stack" style={{ gap: 12 }}>
          <div className="between"><h2 style={{ fontSize: '1.5rem' }}>Refer a collector</h2><span className="mono brass" style={{ fontSize: '1.2rem' }}>{aff.code}</span></div>
          <p className="muted" style={{ lineHeight: 1.6 }}>
            Earn {num(s, 'aff_l1_bp') / 100}% of every box your referrals open in their first {num(s, 'aff_window_days')} days, plus {num(s, 'aff_l2_bp') / 100}% on the people they refer.
            Commissions become credit after {num(s, 'aff_clear_days')} days, up to {usd(num(s, 'aff_monthly_cap_cents'))} a month. Your own boxes never count.
          </p>
          <p style={{ wordBreak: 'break-all' }}>Your link: <span className="mono">{host}/signup?ref={aff.code}</span></p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            {[['Referred by you', String(aff.level1)], ['Referred by them', String(aff.level2)], ['Clearing', usd(aff.pending, { cents: true })], ['Paid to credit', usd(aff.paid, { cents: true })]].map(([k, v]) => (
              <div key={k} className="stack" style={{ gap: 2 }}><span className="muted" style={{ fontSize: '0.8rem' }}>{k}</span><span className="mono" style={{ fontSize: '1.1rem' }}>{v}</span></div>
            ))}
          </div>
          <p className="quiet" style={{ fontSize: '0.8rem' }}>If you post your link, say you earn a commission (for example, &quot;#ad&quot; or &quot;I earn from referrals&quot;). FTC rules require it.</p>
        </section>

        {payouts.length > 0 && (
          <section className="stack">
            <h2 style={{ fontSize: '1.5rem' }}>Cash payouts</h2>
            <div className="scroll"><table className="data"><thead><tr><th>Watch</th><th className="num">Amount</th><th>Status</th></tr></thead>
              <tbody>{payouts.map((p) => <tr key={p.id}><td>{p.brand} {p.model}</td><td className="num">{usd(p.amount_cents, { cents: true })}</td><td>{p.status === 'pending' ? 'Under review' : 'Approved'}</td></tr>)}</tbody>
            </table></div>
          </section>
        )}

        <section className="stack">
          <h2 style={{ fontSize: '1.5rem' }}>Credit history</h2>
          <div className="scroll"><table className="data">
            <thead><tr><th>Date</th><th>What</th><th className="num">Amount</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id}><td className="mono" style={{ fontSize: '0.85rem' }}>{r.created_at.slice(0, 10)}</td><td>{r.memo}</td>
                <td className="num" style={{ color: r.amount_cents < 0 ? 'var(--ivory)' : 'var(--good)' }}>{r.amount_cents > 0 ? '+' : ''}{usd(r.amount_cents, { cents: true })}</td></tr>
            ))}</tbody>
          </table></div>
        </section>
        <p className="muted" style={{ fontSize: '0.9rem' }}>Every pull can be checked: <Link href="/fair">provably fair settings</Link>.</p>
      </div>
    </Shell>
  );
}
