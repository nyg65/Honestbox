import { Shell, Flash } from '@/components/Shell.tsx';
import { AdminNav } from '@/components/AdminNav.tsx';
import { requireAdmin } from '@/lib/auth.ts';
import { listWatches, allBands } from '@/lib/admin.ts';
import { usd } from '@/lib/money.ts';
import { adminAddWatch, adminAssign, adminValue } from '../../actions.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inventory' };

const STATUS: Record<string, string> = { in_box: 'In a box', vault: 'In the vault', pulled: 'In a customer vault', drop: 'In a drop', ship_pending: 'To ship', shipped: 'Shipped' };

export default async function Inventory({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = STATUS[sp.status || ''] ? sp.status : undefined;
  const watches = listWatches(filter);
  const bands = allBands();
  return (
    <Shell>
      <div className="wrap page stack" style={{ gap: 20 }}>
        <AdminNav here="/admin/inventory" />
        <h1 style={{ fontSize: '2.2rem' }}>Inventory</h1>
        <Flash sp={sp} />
        <details className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Add a watch</summary>
          <form action={adminAddWatch} className="stack" style={{ marginTop: 14 }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              <label htmlFor="w-brand">Brand<input id="w-brand" name="brand" required /></label>
              <label htmlFor="w-model">Model<input id="w-model" name="model" required /></label>
              <label htmlFor="w-ref">Reference<input id="w-ref" name="reference" /></label>
              <label htmlFor="w-year">Year<input id="w-year" name="year" inputMode="numeric" /></label>
              <label htmlFor="w-size">Size (mm)<input id="w-size" name="size_mm" inputMode="numeric" /></label>
              <label htmlFor="w-cond">Condition<select id="w-cond" name="condition">{['Unworn', 'Excellent', 'Very good', 'Good'].map((c) => <option key={c}>{c}</option>)}</select></label>
              <label htmlFor="w-papers">Box and papers<select id="w-papers" name="papers">{['Box and papers', 'Papers only', 'Box only', 'Watch only'].map((c) => <option key={c}>{c}</option>)}</select></label>
              <label htmlFor="w-mkt">Market value ($)<input id="w-mkt" name="market" className="mono" required /></label>
              <label htmlFor="w-cost">Our cost ($)<input id="w-cost" name="cost" className="mono" required /></label>
              <label htmlFor="w-n">Recent sales used<input id="w-n" name="sales_count" inputMode="numeric" /></label>
              <label htmlFor="w-lo">Lowest recent sale ($)<input id="w-lo" name="sales_low" className="mono" /></label>
              <label htmlFor="w-hi">Highest recent sale ($)<input id="w-hi" name="sales_high" className="mono" /></label>
              <label htmlFor="w-band">Put it in<select id="w-band" name="band" defaultValue=""><option value="">The vault (not in a box yet)</option>{bands.map((b) => <option key={b.id} value={b.id}>{b.box_name}: {b.label} ({usd(b.value_cents)})</option>)}</select></label>
            </div>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Add a watch only after it has been authenticated and is in the insured vault.</p>
            <button className="btn btn-gold" style={{ alignSelf: 'flex-start' }}>Add watch</button>
          </form>
        </details>
        <nav className="row" aria-label="Filter" style={{ gap: 8 }}>
          <a href="/admin/inventory" className={`pill ${!filter ? 'pill-brass' : ''}`} style={{ textDecoration: 'none' }}>All</a>
          {Object.entries(STATUS).map(([k, v]) => <a key={k} href={`/admin/inventory?status=${k}`} className={`pill ${filter === k ? 'pill-brass' : ''}`} style={{ textDecoration: 'none' }}>{v}</a>)}
        </nav>
        <div className="scroll"><table className="data" style={{ minWidth: 980 }}>
          <thead><tr><th>#</th><th>Watch</th><th>Where</th><th className="num">Cost</th><th>Market value</th><th>Move</th></tr></thead>
          <tbody>{watches.map((w) => (
            <tr key={String(w.id)}>
              <td className="mono quiet">{String(w.id)}</td>
              <td><strong>{String(w.brand)} {String(w.model)}</strong><br /><span className="quiet" style={{ fontSize: '0.8rem' }}>{String(w.reference || '')} · {String(w.condition)} · {String(w.papers)}</span></td>
              <td style={{ fontSize: '0.9rem' }}>{STATUS[String(w.status)] || String(w.status)}{w.box_name ? <><br /><span className="quiet">{String(w.box_name)}: {String(w.band_label)}</span></> : null}</td>
              <td className="num">{usd(Number(w.cost_cents))}</td>
              <td><form action={adminValue} className="row" style={{ gap: 6, flexWrap: 'nowrap' }}><input type="hidden" name="watch" value={String(w.id)} /><input aria-label="Market value" name="market" className="mono" defaultValue={String(Number(w.market_cents) / 100)} style={{ width: 110, minHeight: 36, padding: 6 }} /><button className="btn btn-small">Save</button></form></td>
              <td>{['in_box', 'vault'].includes(String(w.status)) ? (
                <form action={adminAssign} className="row" style={{ gap: 6, flexWrap: 'nowrap' }}><input type="hidden" name="watch" value={String(w.id)} />
                  <select aria-label="Move to" name="band" defaultValue={w.band_id ? String(w.band_id) : ''} style={{ minHeight: 36, padding: 6, maxWidth: 260 }}><option value="">Vault</option>{bands.map((b) => <option key={b.id} value={b.id}>{b.box_name}: {b.label}</option>)}</select>
                  <button className="btn btn-small">Move</button></form>
              ) : <span className="quiet">—</span>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </Shell>
  );
}
