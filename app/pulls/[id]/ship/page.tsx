import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Shell, Flash } from '@/components/Shell.tsx';
import { AddressFields } from '@/components/AddressFields.tsx';
import { requireUser } from '@/lib/auth.ts';
import { getPull } from '@/lib/engine.ts';
import { usd } from '@/lib/money.ts';
import { shipAction } from '../../../actions.ts';

export const dynamic = 'force-dynamic';

export default async function Ship({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params; const sp = await searchParams;
  const user = await requireUser(`/pulls/${id}/ship`);
  const p = getPull(user.id, Number(id));
  if (!p) notFound();
  if (p.status !== 'vault') redirect(`/pulls/${id}`);
  return (
    <Shell tab="vault">
      <div className="narrow page stack" style={{ gap: 20 }}>
        <Link href={`/pulls/${id}`} className="muted" style={{ textDecoration: 'none' }}>← Back to your pull</Link>
        <h1 style={{ fontSize: '2.1rem' }}>Ship your {p.brand} {p.model}</h1>
        <p className="muted">Insured for its full value of {usd(p.market_cents)}, signature required. Free shipping in the US.</p>
        <Flash sp={sp} />
        <form action={shipAction} className="stack">
          <input type="hidden" name="pull" value={p.id} />
          <AddressFields name={user.name} state={user.state} />
          <button className="btn btn-gold btn-block">Ship it to me</button>
        </form>
      </div>
    </Shell>
  );
}
