import { Shell, Flash } from '@/components/Shell.tsx';
import { AdminNav } from '@/components/AdminNav.tsx';
import { requireAdmin } from '@/lib/auth.ts';
import { listShipments } from '@/lib/admin.ts';
import { usd } from '@/lib/money.ts';
import { adminShip } from '../../actions.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shipping' };

export default async function Shipments({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = listShipments();
  return (
    <Shell>
      <div className="wrap page stack" style={{ gap: 20 }}>
        <AdminNav here="/admin/shipments" />
        <h1 style={{ fontSize: '2.2rem' }}>Shipping</h1>
        <p className="muted">Ship insured for the full market value, signature required. Enter the tracking number once the vault hands it to the carrier.</p>
        <Flash sp={sp} />
        {rows.length === 0 ? <p className="card">Nothing to ship.</p> : (
          <div className="scroll"><table className="data" style={{ minWidth: 860 }}>
            <thead><tr><th>Requested</th><th>Watch</th><th className="num">Insure for</th><th>Ship to</th><th>Tracking</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={String(r.id)}>
                <td className="mono" style={{ fontSize: '0.85rem' }}>{String(r.created_at).slice(0, 10)}<br /><span className="quiet">{r.source === 'drop' ? 'Drop sale' : 'Box pull'}</span></td>
                <td>{String(r.brand)} {String(r.model)}<br /><span className="quiet" style={{ fontSize: '0.8rem' }}>{String(r.reference || '')}</span></td>
                <td className="num">{usd(Number(r.market_cents))}</td>
                <td style={{ fontSize: '0.9rem' }}>{String(r.name)}<br />{String(r.line1)}{r.line2 ? `, ${String(r.line2)}` : ''}<br />{String(r.city)}, {String(r.state)} {String(r.zip)}<br /><span className="quiet">{String(r.email)}</span></td>
                <td>{r.status === 'requested' ? (
                  <form action={adminShip} className="row" style={{ gap: 6, flexWrap: 'nowrap' }}><input type="hidden" name="id" value={String(r.id)} />
                    <input aria-label="Tracking number" name="tracking" className="mono" style={{ minHeight: 36, padding: 6, width: 170 }} required /><button className="btn btn-small btn-gold">Shipped</button></form>
                ) : <span className="mono" style={{ fontSize: '0.85rem' }}>{String(r.tracking)}</span>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </Shell>
  );
}
