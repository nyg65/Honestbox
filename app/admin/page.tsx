import Link from 'next/link';
import { Shell } from '@/components/Shell.tsx';
import { AdminNav } from '@/components/AdminNav.tsx';
import { requireAdmin } from '@/lib/auth.ts';
import { dashboard, recentAudit } from '@/lib/admin.ts';
import { listBoxes, bandsFor, boxState, settings, flag } from '@/lib/engine.ts';
import { houseEdge } from '@/lib/fair.ts';
import { usd } from '@/lib/money.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin' };

export default async function Admin() {
  await requireAdmin();
  const m = dashboard();
  const s = settings();
  const boxes = listBoxes().map((b) => { const bands = bandsFor(b.id); return { ...b, bands, st: boxState(b, bands, s), edge: houseEdge(bands, b.price_cents) }; });
  const log = recentAudit();
  const tiles: [string, string, string?][] = [
    ['Sales, last 30 days', usd(m.sales30)], ['Pulls, last 30 days', m.pulls30.toLocaleString('en-US')],
    ['Customer credit outstanding', usd(m.creditOutstanding), 'What you owe customers in credit'],
    ['Buyback exposure', usd(m.vaultExposure), 'If every pull in customer vaults were sold back for credit today'],
    ['Locked values vs market', `${m.lockedCount} · ${m.lockedGap >= 0 ? '+' : ''}${usd(m.lockedGap)}`, 'Positive means customers locked above today\'s market: the cost of locks'],
    ['Cash payouts waiting', `${m.pendingPayouts} · ${usd(m.pendingPayoutCents)}`], ['Watches to ship', String(m.toShip)],
    ['Inventory at cost', usd(m.inventoryCost)], ['Customers', m.users.toLocaleString('en-US')],
  ];
  return (
    <Shell>
      <div className="wrap page stack" style={{ gap: 22 }}>
        <AdminNav here="/admin" />
        <div className="between"><h1 style={{ fontSize: '2.2rem' }}>Overview</h1>
          <span className="row"><span className={`pill ${flag(s, 'boxes_enabled') ? 'pill-brass' : ''}`}>Boxes {flag(s, 'boxes_enabled') ? 'on' : 'paused'}</span><span className="pill">{flag(s, 'real_money') ? 'Real money' : 'Test mode'}</span></span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {tiles.map(([k, v, hint]) => (
            <div key={k} className="card stack" style={{ gap: 4, padding: 16 }}><span className="muted" style={{ fontSize: '0.8rem' }}>{k}</span><span className="mono" style={{ fontSize: '1.35rem' }}>{v}</span>{hint && <span className="quiet" style={{ fontSize: '0.75rem' }}>{hint}</span>}</div>
          ))}
        </div>
        <section className="stack">
          <h2 style={{ fontSize: '1.4rem' }}>Boxes</h2>
          <div className="scroll"><table className="data"><thead><tr><th>Box</th><th className="num">Price</th><th className="num">Edge</th><th>Stock by band</th><th>Status</th></tr></thead>
            <tbody>{boxes.map((b) => (
              <tr key={b.id}><td><Link href={`/admin/boxes/${b.slug}`}>{b.name}</Link></td><td className="num">{usd(b.price_cents)}</td><td className="num">{(b.edge * 100).toFixed(1)}%</td>
                <td className="mono" style={{ fontSize: '0.85rem' }}>{b.bands.map((x) => x.stock).join(' · ')}</td>
                <td>{b.st.openable ? 'Open' : <span style={{ color: 'var(--bad)' }}>{b.st.reason}</span>}</td></tr>
            ))}</tbody></table></div>
        </section>
        <section className="stack">
          <h2 style={{ fontSize: '1.4rem' }}>Recent activity</h2>
          <div className="scroll"><table className="data"><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
            <tbody>{log.map((a) => (
              <tr key={String(a.id)}><td className="mono" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{String(a.created_at).slice(0, 16).replace('T', ' ')}</td><td>{String(a.email ?? 'system')}</td>
                <td style={{ fontSize: '0.85rem' }}>{String(a.action)} <span className="quiet">{String(a.detail).slice(0, 120)}</span></td></tr>
            ))}</tbody></table></div>
        </section>
      </div>
    </Shell>
  );
}
