import { Shell, Flash } from '@/components/Shell.tsx';
import { Verifier } from '@/components/Verifier.tsx';
import { currentUser } from '@/lib/auth.ts';
import { activeSeed, type Seed } from '@/lib/engine.ts';
import { db } from '@/lib/db.ts';
import { rotateSeedAction } from '../actions.ts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Provably fair' };

export default async function Fair({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const user = await currentUser();
  const seed = user ? activeSeed(user.id) : null;
  const old = user ? (db().prepare('SELECT * FROM seeds WHERE user_id = ? AND active = 0 ORDER BY id DESC LIMIT 5').all(user.id) as Seed[]) : [];
  return (
    <Shell>
      <div className="narrow page stack" style={{ gap: 22, maxWidth: 680 }}>
        <span className="eyebrow">Don&apos;t take our word for it</span>
        <h1 style={{ fontSize: '2.5rem' }}>Provably fair</h1>
        <Flash sp={sp} />
        <ol className="stack" style={{ paddingLeft: 20, margin: 0, gap: 10, lineHeight: 1.6 }}>
          <li>Before you open anything, we show you the <strong>SHA-256 hash</strong> of a secret server seed. That locks in our side of every roll.</li>
          <li>You choose the <strong>client seed</strong>, so we can&apos;t pick a seed pair that favors us.</li>
          <li>Each pull computes HMAC-SHA256(server seed, &quot;client seed:nonce&quot;). The first 13 hex digits, scaled to 0–999,999, are the roll. The nonce counts up by one per pull.</li>
          <li>The roll lands in one band of the published odds, read top to bottom. A second roll with &quot;:unit&quot; added picks which physical watch in that band.</li>
          <li>When you rotate your seed, we reveal the old server seed. Check that it hashes to what we showed you, then re-compute every pull yourself.</li>
        </ol>

        {seed ? (
          <section className="cert stack" style={{ gap: 10, wordBreak: 'break-all' }}>
            <h2 style={{ fontSize: '1.3rem' }}>Your active seed pair</h2>
            <span>Server seed hash: <span className="mono">{seed.server_hash}</span></span>
            <span>Client seed: <span className="mono">{seed.client_seed}</span> · Next nonce: <span className="mono">{seed.next_nonce}</span></span>
            <form action={rotateSeedAction} className="stack" style={{ gap: 10, marginTop: 6 }}>
              <label htmlFor="cs">New client seed (optional; letters, numbers, dashes)<input id="cs" name="client_seed" className="mono" placeholder="leave blank for a random one" /></label>
              <button className="btn">Reveal this server seed and start a new pair</button>
            </form>
          </section>
        ) : <p className="card">Sign in to see your seed pair.</p>}

        {old.length > 0 && (
          <section className="stack" style={{ gap: 10 }}>
            <h2 style={{ fontSize: '1.3rem' }}>Revealed seeds</h2>
            {old.map((o) => (
              <div key={o.id} className="card stack" style={{ gap: 4, fontSize: '0.85rem', wordBreak: 'break-all' }}>
                <span>Server seed: <span className="mono">{o.server_seed}</span></span>
                <span>Hash shown before use: <span className="mono">{o.server_hash}</span></span>
                <span>Client seed: <span className="mono">{o.client_seed}</span> · Pulls: nonces 0 to {o.next_nonce - 1}</span>
              </div>
            ))}
          </section>
        )}

        <section className="stack">
          <h2 style={{ fontSize: '1.3rem' }}>Verify a roll</h2>
          <Verifier initial={old[0] ? { server: old[0].server_seed, client: old[0].client_seed, nonce: 0, hash: old[0].server_hash } : undefined} />
        </section>
      </div>
    </Shell>
  );
}
