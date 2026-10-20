'use client';
// Re-computes a pull in the browser with the Web Crypto API: the same math as lib/fair.ts.
import { useState } from 'react';

async function hmacFraction(key: string, msg: string) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
  const hex = Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('');
  return parseInt(hex.slice(0, 13), 16) / 2 ** 52;
}
async function sha256(s: string) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function Verifier({ initial }: { initial?: { server: string; client: string; nonce: number; hash: string } }) {
  const [server, setServer] = useState(initial?.server || '');
  const [client, setClient] = useState(initial?.client || '');
  const [nonce, setNonce] = useState(String(initial?.nonce ?? 0));
  const [out, setOut] = useState<{ hash: string; roll: number } | null>(null);
  return (
    <form className="stack" onSubmit={async (e) => {
      e.preventDefault();
      const roll = Math.floor((await hmacFraction(server.trim(), `${client.trim()}:${Number(nonce)}`)) * 1_000_000);
      setOut({ hash: await sha256(server.trim()), roll });
    }}>
      <label htmlFor="v-server">Server seed (revealed)<input id="v-server" className="mono" value={server} onChange={(e) => setServer(e.target.value)} required /></label>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <label htmlFor="v-client" style={{ flex: '3 1 200px' }}>Client seed<input id="v-client" className="mono" value={client} onChange={(e) => setClient(e.target.value)} required /></label>
        <label htmlFor="v-nonce" style={{ flex: '1 1 90px' }}>Nonce<input id="v-nonce" className="mono" inputMode="numeric" value={nonce} onChange={(e) => setNonce(e.target.value)} required /></label>
      </div>
      <button className="btn">Re-compute the roll</button>
      {out && (
        <div className="card stack" style={{ gap: 6, wordBreak: 'break-all', fontSize: '0.9rem' }}>
          <span>SHA-256 of the server seed: <span className="mono">{out.hash}</span></span>
          {initial?.hash && <span className={out.hash === initial.hash ? 'brass' : ''}>{out.hash === initial.hash ? 'Matches the hash we showed you before your pulls.' : 'Does not match the hash on file for this seed.'}</span>}
          <span>Roll: <span className="mono">{out.roll.toLocaleString('en-US')}</span> of 1,000,000. Find it in the box&apos;s cumulative odds to see which band it lands in.</span>
        </div>
      )}
    </form>
  );
}
