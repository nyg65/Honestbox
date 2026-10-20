import Link from 'next/link';
import { currentUser } from '@/lib/auth.ts';
import { balance, settings, flag } from '@/lib/engine.ts';
import { usd } from '@/lib/money.ts';
import { settleCommissions } from '@/lib/affiliate.ts';
import { Mark } from './Mark.tsx';

export async function Shell({ children, tab }: { children: React.ReactNode; tab?: 'boxes' | 'drops' | 'vault' | 'account' }) {
  const user = await currentUser();
  if (user) settleCommissions(user.id);
  const s = settings();
  const bal = user ? balance(user.id) : 0;
  return (
    <>
      {!flag(s, 'real_money') && <div className="testbar">Test mode: no real money is charged or paid out.</div>}
      <header className="top">
        <div className="wrap">
          <Link href="/" className="brand" aria-label="HonestBox home">
            <Mark size={38} />
            <span className="wordmark">HONEST<b>BOX</b></span>
          </Link>
          <nav className="topnav" aria-label="Main">
            <Link href="/boxes" className="hide-sm">Boxes</Link>
            <Link href="/drops" className="hide-sm">Drops</Link>
            <Link href="/ledger" className="hide-sm">The Honest Ledger</Link>
            {user ? (
              <>
                <Link href="/vault" className="hide-sm">My vault</Link>
                {user.role === 'admin' && <Link href="/admin" className="hide-sm">Admin</Link>}
                <Link href="/account" className="credit"><span className="muted" style={{ fontFamily: 'var(--sans)' }}>Credit </span>{usd(bal)}</Link>
              </>
            ) : (
              <>
                <Link href="/signin">Sign in</Link>
                <Link href="/signup" className="btn btn-gold btn-small">Join</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <nav className="tabbar" aria-label="App">
        <Link href="/boxes" className={tab === 'boxes' ? 'on' : ''}><Icon d="M3 7h18v13H3zM3 11h18M12 7v13" />Boxes</Link>
        <Link href="/drops" className={tab === 'drops' ? 'on' : ''}><Icon d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l3 2M9 2h6" />Drops</Link>
        <Link href="/vault" className={tab === 'vault' ? 'on' : ''}><Icon d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />Vault</Link>
        <Link href="/account" className={tab === 'account' ? 'on' : ''}><Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />Account</Link>
      </nav>
      <Footer />
    </>
  );
}

function Icon({ d }: { d: string }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={d} /></svg>;
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--rule)' }}>
      <div className="wrap stack" style={{ paddingBlock: '40px 110px', fontSize: '0.85rem', color: 'var(--muted)' }}>
        <div className="between">
          <span className="wordmark" style={{ color: 'var(--ivory)' }}>HONEST<b>BOX</b></span>
          <nav className="row" style={{ gap: 20 }} aria-label="Legal">
            <Link href="/legal/rules">Official rules and odds</Link>
            <Link href="/legal/free-entry">Free entry method</Link>
            <Link href="/legal/buyback">Buyback terms</Link>
            <Link href="/fair">Provably fair</Link>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/privacy">Privacy</Link>
          </nav>
        </div>
        <p style={{ maxWidth: '60rem' }}>
          No purchase necessary. Void where prohibited. Must be 18 or older and located in an eligible state. Watch values are estimates based on recent market sales.
          HonestBox is not affiliated with or endorsed by the watch brands it sells. © {new Date().getFullYear()} HonestBox LLC.
        </p>
      </div>
    </footer>
  );
}

export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const err = typeof sp.error === 'string' ? sp.error : undefined;
  const ok = typeof sp.ok === 'string' ? sp.ok : undefined;
  if (!err && !ok) return null;
  return <div role={err ? 'alert' : 'status'} className={`flash ${err ? 'flash-error' : 'flash-ok'}`}>{err || ok}</div>;
}
