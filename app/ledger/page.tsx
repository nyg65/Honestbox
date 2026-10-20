import Link from 'next/link';
import { Shell } from '@/components/Shell.tsx';
import { honestLedger } from '@/lib/engine.ts';
import { db } from '@/lib/db.ts';
import { usd, pct } from '@/lib/money.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'The Honest Ledger' };

export default async function Ledger({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.month || '') ? sp.month : undefined;
  const L = honestLedger(month);
  const months = (db().prepare(`SELECT DISTINCT substr(created_at, 1, 7) AS m FROM pulls ORDER BY m DESC LIMIT 24`).all() as { m: string }[]).map((r) => r.m);
  const fmtMonth = (m: string) => new Date(`${m}-01T12:00:00Z`).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <Shell>
      <div className="wrap page stack" style={{ gap: 26, maxWidth: 900 }}>
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">Published live from our records</span>
          <h1 style={{ fontSize: '2.6rem' }}>The Honest Ledger</h1>
          <p className="muted" style={{ maxWidth: '42rem', lineHeight: 1.6 }}>Every pull, counted in the band it landed in, next to the odds we published. Small samples swing; over thousands of pulls the actual share should sit close to the published odds. Every pull can also be <Link href="/fair">verified on its own</Link>.</p>
        </div>
        <nav className="row" aria-label="Period" style={{ gap: 8 }}>
          <Link href="/ledger" className={`pill ${!month ? 'pill-brass' : ''}`} style={{ textDecoration: 'none' }}>All time</Link>
          {months.map((m) => <Link key={m} href={`/ledger?month=${m}`} className={`pill ${month === m ? 'pill-brass' : ''}`} style={{ textDecoration: 'none' }}>{fmtMonth(m)}</Link>)}
        </nav>

        {L.boxes.map(({ box, bands, pulls, edge }) => (
          <section key={box.id} className="card stack" style={{ gap: 12 }}>
            <div className="between">
              <h2 style={{ fontSize: '1.5rem' }}>{box.name} <span className="mono muted" style={{ fontSize: '1rem', fontFamily: 'var(--mono)' }}>{usd(box.price_cents)}</span></h2>
              <span className="muted">{pulls.toLocaleString('en-US')} pulls · published edge {(edge * 100).toFixed(1)}%</span>
            </div>
            <div className="scroll"><table className="data" style={{ minWidth: 520 }}>
              <thead><tr><th>Band</th><th className="num">Value</th><th className="num">Published odds</th><th className="num">Actual pulls</th><th className="num">Actual share</th></tr></thead>
              <tbody>{bands.map((b) => (
                <tr key={b.label}>
                  <td>{b.label}</td><td className="num">{usd(b.value_cents)}</td><td className="num">{pct(b.odds_ppm, 2)}</td>
                  <td className="num">{b.actual.toLocaleString('en-US')}</td>
                  <td className="num">{pulls ? pct(Math.round((b.actual / pulls) * 1_000_000), 2) : '—'}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </section>
        ))}

        <section className="cert stack" style={{ gap: 8 }}>
          <h2 style={{ fontSize: '1.4rem' }}>Buybacks paid</h2>
          {L.buybacks.length === 0 ? <p className="muted">None in this period.</p> : L.buybacks.map((b) => (
            <div key={b.method} className="between"><span>{b.method === 'credit' ? 'As HonestBox credit' : 'As cash'} · {Number(b.n).toLocaleString('en-US')}</span><span className="mono">{usd(Number(b.total))}</span></div>
          ))}
        </section>
      </div>
    </Shell>
  );
}
