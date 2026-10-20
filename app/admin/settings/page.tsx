import { Shell, Flash } from '@/components/Shell.tsx';
import { AdminNav } from '@/components/AdminNav.tsx';
import { requireAdmin } from '@/lib/auth.ts';
import { settings, flag } from '@/lib/engine.ts';
import { affiliateLeaders } from '@/lib/affiliate.ts';
import { usd } from '@/lib/money.ts';
import { adminSettings, adminCredit, adminVerify } from '../../actions.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings' };

const FIELDS: [string, string, string][] = [
  ['buyback_credit_bp', 'Buyback as credit', 'basis points: 9000 = 90%'],
  ['buyback_cash_bp', 'Buyback as cash', 'basis points: 8500 = 85%'],
  ['cash_id_threshold_cents', 'Cash payouts above this need an ID', 'cents: 250000 = $2,500'],
  ['hold_days', 'Days a pull can stay in a customer vault', 'after this it is sold back for credit at that day\'s value'],
  ['drop_hold_minutes', 'Drop checkout hold', 'minutes'],
  ['ship_fee_cents', 'Shipping fee on low-value pulls', 'cents: 1500 = $15'],
  ['ship_fee_under_cents', 'Pulls worth less than this pay the fee', 'cents: 25000 = $250'],
  ['excluded_states', 'States where boxes are closed', 'comma-separated; set from the attorney\'s opinion'],
  ['min_age', 'Minimum age', ''],
  ['aff_l1_bp', 'Affiliate level 1', 'basis points of box price: 500 = 5%'],
  ['aff_l2_bp', 'Affiliate level 2', 'basis points: 100 = 1%'],
  ['aff_window_days', 'Commission window per referred customer', 'days from sign-up'],
  ['aff_clear_days', 'Clearing period before commissions become credit', 'days'],
  ['aff_monthly_cap_cents', 'Monthly cap per affiliate', 'cents: 250000 = $2,500'],
];

export default async function AdminSettings({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const s = settings();
  const leaders = affiliateLeaders();
  return (
    <Shell>
      <div className="wrap page stack" style={{ gap: 22 }}>
        <AdminNav here="/admin/settings" />
        <h1 style={{ fontSize: '2.2rem' }}>Settings and affiliates</h1>
        <Flash sp={sp} />
        <form action={adminSettings} className="card stack">
          <label className="check" htmlFor="boxes_enabled"><input id="boxes_enabled" name="boxes_enabled" type="checkbox" defaultChecked={flag(s, 'boxes_enabled')} /> Mystery boxes are open (turn off to run drops only)</label>
          <label className="check" htmlFor="lock_enabled"><input id="lock_enabled" name="lock_enabled" type="checkbox" defaultChecked={flag(s, 'lock_enabled')} /> Customers can lock in today&apos;s value (protects them if prices fall)</label>
          <label className="check" htmlFor="real_money"><input id="real_money" name="real_money" type="checkbox" defaultChecked={flag(s, 'real_money')} /> Real payments (needs a connected payment processor)</label>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {FIELDS.map(([k, label, hint]) => (
              <label key={k} htmlFor={k}>{label}<input id={k} name={k} className="mono" defaultValue={s[k]} />{hint && <span className="quiet" style={{ fontSize: '0.75rem' }}>{hint}</span>}</label>
            ))}
          </div>
          <button className="btn btn-gold" style={{ alignSelf: 'flex-start' }}>Save settings</button>
        </form>

        <section className="card stack">
          <h2 style={{ fontSize: '1.4rem' }}>Affiliates</h2>
          {leaders.length === 0 ? <p className="muted">No referrals yet.</p> : (
            <div className="scroll"><table className="data" style={{ minWidth: 640 }}>
              <thead><tr><th>Affiliate</th><th>Code</th><th className="num">Direct referrals</th><th className="num">Level 1 earned</th><th className="num">Level 2 earned</th><th className="num">Clearing</th></tr></thead>
              <tbody>{leaders.map((l) => (
                <tr key={String(l.email)}><td>{String(l.name)}<br /><span className="quiet" style={{ fontSize: '0.8rem' }}>{String(l.email)}</span></td><td className="mono">{String(l.referral_code)}</td>
                  <td className="num">{String(l.direct)}</td><td className="num">{usd(Number(l.l1), { cents: true })}</td><td className="num">{usd(Number(l.l2), { cents: true })}</td><td className="num">{usd(Number(l.pending), { cents: true })}</td></tr>
              ))}</tbody>
            </table></div>
          )}
        </section>

        <div className="grid">
          <form action={adminCredit} className="card stack">
            <h2 style={{ fontSize: '1.3rem' }}>Post credit to an account</h2>
            <p className="muted" style={{ fontSize: '0.85rem' }}>For free entries, goodwill or corrections. Use a negative amount to take credit back.</p>
            <label htmlFor="c-email">Customer email<input id="c-email" name="email" type="email" required /></label>
            <label htmlFor="c-amt">Amount ($)<input id="c-amt" name="amount" className="mono" required /></label>
            <label htmlFor="c-memo">Note the customer will see<input id="c-memo" name="memo" placeholder="Free entry" /></label>
            <button className="btn">Post credit</button>
          </form>
          <form action={adminVerify} className="card stack">
            <h2 style={{ fontSize: '1.3rem' }}>Identity check</h2>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Mark a customer as ID-verified after the identity-check service confirms them. Needed for cash payouts above the limit.</p>
            <label htmlFor="v-email">Customer email<input id="v-email" name="email" type="email" required /></label>
            <label className="check" htmlFor="v-ok"><input id="v-ok" name="verified" type="checkbox" defaultChecked /> ID verified</label>
            <button className="btn">Save</button>
          </form>
        </div>
      </div>
    </Shell>
  );
}
