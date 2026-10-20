import Link from 'next/link';
import { Shell, Flash } from '@/components/Shell.tsx';
import { signInAction } from '../actions.ts';

export const metadata = { title: 'Sign in' };

export default async function SignIn({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <Shell>
      <div className="narrow page stack" style={{ gap: 22 }}>
        <h1 style={{ fontSize: '2.4rem' }}>Welcome back</h1>
        <Flash sp={sp} />
        <form action={signInAction} className="stack">
          <input type="hidden" name="next" value={sp.next || '/boxes'} />
          <label htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" required /></label>
          <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="current-password" required /></label>
          <button className="btn btn-gold btn-block">Sign in</button>
        </form>
        <p className="muted">New to HonestBox? <Link href="/signup">Create an account</Link></p>
        <div className="card" style={{ fontSize: '0.9rem' }}>
          <p className="muted">Test accounts: <span className="mono">demo@honestbox.test</span> / <span className="mono">demo-1234</span></p>
        </div>
      </div>
    </Shell>
  );
}
