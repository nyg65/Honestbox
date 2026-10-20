import Link from 'next/link';
import { Shell, Flash } from '@/components/Shell.tsx';
import { signUpAction } from '../actions.ts';
import { US_STATES } from '@/lib/auth.ts';

export const metadata = { title: 'Join' };

export default async function SignUp({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return (
    <Shell>
      <div className="narrow page stack" style={{ gap: 22 }}>
        <h1 style={{ fontSize: '2.4rem' }}>Join HonestBox</h1>
        <p className="muted">Open boxes with published odds, buy weekly drops, and sell back any pull at a fair price.</p>
        <Flash sp={sp} />
        <form action={signUpAction} className="stack">
          <label htmlFor="name">Full name<input id="name" name="name" autoComplete="name" required /></label>
          <label htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" required /></label>
          <label htmlFor="password">Password (8 characters or more)<input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
          <label htmlFor="state">State you live in
            <select id="state" name="state" required defaultValue="">
              <option value="" disabled>Choose a state</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label htmlFor="ref">Referral code (optional)<input id="ref" name="ref" className="mono" defaultValue={sp.ref || ''} autoCapitalize="characters" maxLength={12} /></label>
          <label className="check" htmlFor="adult"><input id="adult" name="adult" type="checkbox" required /> I am 18 or older and agree to the <Link href="/legal/terms">terms</Link> and <Link href="/legal/rules">official rules</Link>.</label>
          <button className="btn btn-gold btn-block">Create account</button>
        </form>
        <p className="muted">Already a member? <Link href="/signin">Sign in</Link></p>
      </div>
    </Shell>
  );
}
