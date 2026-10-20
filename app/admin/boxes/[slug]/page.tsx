import { notFound } from 'next/navigation';
import { Shell, Flash } from '@/components/Shell.tsx';
import { AdminNav } from '@/components/AdminNav.tsx';
import { OddsEditor } from '@/components/OddsEditor.tsx';
import { requireAdmin } from '@/lib/auth.ts';
import { getBox, bandsFor } from '@/lib/engine.ts';
import { adminSaveBox } from '../../../actions.ts';

export const dynamic = 'force-dynamic';

export default async function AdminBox({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  const { slug } = await params; const sp = await searchParams;
  const box = getBox(slug);
  if (!box) notFound();
  const bands = bandsFor(box.id);
  return (
    <Shell>
      <div className="wrap page stack" style={{ gap: 20 }}>
        <AdminNav here={`/admin/boxes/${slug}`} />
        <h1 style={{ fontSize: '2.2rem' }}>{box.name}</h1>
        <p className="muted" style={{ maxWidth: '46rem' }}>Changes publish immediately to the box page and the Honest Ledger. Every past pull keeps a snapshot of the odds it was drawn under. Bands are rolled in this order, top to bottom.</p>
        <Flash sp={sp} />
        <form action={adminSaveBox} className="card stack">
          <input type="hidden" name="box" value={box.id} />
          <input type="hidden" name="slug" value={box.slug} />
          <label className="check" htmlFor="active"><input id="active" name="active" type="checkbox" defaultChecked={!!box.active} /> Box is open to customers</label>
          <OddsEditor price={String(box.price_cents / 100)} rows={bands.map((b) => ({ id: b.id, label: b.label, value: String(b.value_cents / 100), odds: String(b.odds_ppm / 10000), stock: b.stock ?? 0 }))} />
        </form>
      </div>
    </Shell>
  );
}
