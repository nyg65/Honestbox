import { Shell, Flash } from '@/components/Shell.tsx';
import { AdminNav } from '@/components/AdminNav.tsx';
import { requireAdmin } from '@/lib/auth.ts';
import { listPayouts } from '@/lib/admin.ts';
import { usd } from '@/lib/money.ts';
import { adminPayout } from '../../actions.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payouts' };

export default async function Payouts({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = listPayouts();
  return (
    <Shell>
      <div className="wrap page stack" style={{ gap: 20 }}>
        <AdminNav here="/admin/payouts" />
        <h1 style={{ fontSize: '2.2rem' }}>Cash payouts</h1>
        <p className="muted" style={{ maxWidth: '46rem' }}>Every cash buyback waits here for an owner to approve it. Approving records the decision. Send the money through the payment processor and keep its reference. Declining puts the watch back in the customer&apos;s vault so they can choose again.</p>
        <Flash sp={sp} />
        {rows.length === 0 ? <p className="card">No cash payouts yet.</p> : (
          <div className="scroll"><table className="data" style={{ minWidth: 760 }}>
            <thead><tr><th>Requested</th><th>Customer</th><th>Watch</th><th className="num">Amount</th><th>Decision</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={String(r.id)}>
                <td className="mono" style={{ fontSize: '0.85rem' }}>{String(r.created_at).slice(0, 10)}</td>
                <td>{String(r.name)}<br /><span className="quiet" style={{ fontSize: '0.8rem' }}>{String(r.email)} · ID {r.id_verified ? 'verified' : 'not verified'}</span></td>
                <td>{String(r.brand)} {String(r.model)}</td>
                <td className="num">{usd(Number(r.amount_cents), { cents: true })}</td>
                <td>{r.status === 'pending' ? (
                  <form action={adminPayout} className="row" style={{ gap: 6 }}><input type="hidden" name="id" value={String(r.id)} />
                    <button name="decision" value="approve" className="btn btn-gold btn-small">Approve</button>
                    <button name="decision" value="decline" className="btn btn-small">Decline</button></form>
                ) : <span className="pill">Approved</span>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </Shell>
  );
}
