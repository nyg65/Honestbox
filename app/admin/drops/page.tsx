import { Shell, Flash } from '@/components/Shell.tsx';
import { AdminNav } from '@/components/AdminNav.tsx';
import { requireAdmin } from '@/lib/auth.ts';
import { currentDrop } from '@/lib/engine.ts';
import { listWatches } from '@/lib/admin.ts';
import { usd } from '@/lib/money.ts';
import { adminDropAdd, adminDropStart } from '../../actions.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Drops admin' };

export default async function AdminDrops({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const drop = currentDrop();
  const vault = listWatches('vault');
  return (
    <Shell>
      <div className="wrap page stack" style={{ gap: 20 }}>
        <AdminNav here="/admin/drops" />
        <h1 style={{ fontSize: '2.2rem' }}>Drops</h1>
        <Flash sp={sp} />
        <section className="card stack">
          <div className="between"><h2 style={{ fontSize: '1.4rem' }}>{drop ? `${drop.title}, ends ${new Date(drop.ends_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}` : 'No drop is running'}</h2></div>
          {drop && (
            <div className="scroll"><table className="data"><thead><tr><th>Watch</th><th className="num">Price</th><th className="num">Market</th><th>Status</th></tr></thead>
              <tbody>{drop.items.map((i) => <tr key={i.item_id}><td>{i.brand} {i.model}</td><td className="num">{usd(i.price_cents)}</td><td className="num">{usd(i.market_cents)}</td><td>{i.item_status}</td></tr>)}</tbody></table></div>
          )}
          <form action={adminDropStart} className="row">
            <label htmlFor="days" style={{ maxWidth: 160 }}>Length (days)<input id="days" name="days" defaultValue="7" inputMode="numeric" /></label>
            <button className="btn" style={{ alignSelf: 'flex-end' }}>Start the next drop</button>
          </form>
          <p className="quiet" style={{ fontSize: '0.85rem' }}>Starting a new drop ends the current one. Unsold pieces stay listed under the old drop; move them back to the vault from Inventory if needed.</p>
        </section>
        <section className="card stack">
          <h2 style={{ fontSize: '1.4rem' }}>Add a vault watch to the current drop</h2>
          {vault.length === 0 ? <p className="muted">No watches are waiting in the vault. Add one in Inventory with &quot;The vault&quot; selected.</p> : (
            <form action={adminDropAdd} className="row" style={{ alignItems: 'flex-end' }}>
              <label htmlFor="d-watch" style={{ flex: '2 1 260px' }}>Watch<select id="d-watch" name="watch">{vault.map((w) => <option key={String(w.id)} value={String(w.id)}>{String(w.brand)} {String(w.model)} · market {usd(Number(w.market_cents))}</option>)}</select></label>
              <label htmlFor="d-price" style={{ flex: '1 1 140px' }}>Drop price ($)<input id="d-price" name="price" className="mono" required /></label>
              <button className="btn btn-gold">Add to drop</button>
            </form>
          )}
        </section>
      </div>
    </Shell>
  );
}
