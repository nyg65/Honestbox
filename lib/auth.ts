// Website sessions: the shared account logic in accounts.ts, carried in an HTTP-only cookie.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { issueToken, userByToken, revokeToken, checkCredentials, createAccount, type User, type SignUpInput, US_STATES } from './accounts.ts';

export type { User };
export { US_STATES };
const COOKIE = 'hb_session';

export async function currentUser(): Promise<User | null> {
  return userByToken((await cookies()).get(COOKIE)?.value);
}

export async function requireUser(next = '/boxes'): Promise<User> {
  const u = await currentUser();
  if (!u) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return u;
}

export async function requireAdmin(): Promise<User> {
  const u = await requireUser('/admin');
  if (u.role !== 'admin') redirect('/boxes');
  return u;
}

async function startSession(userId: number) {
  const { token, expires } = issueToken(userId);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires });
}

export async function signIn(email: string, password: string) {
  await startSession(checkCredentials(email, password));
}

export async function signUp(f: SignUpInput) {
  const r = createAccount(f);
  await startSession(r.userId);
  return { boxesBlocked: r.boxesBlocked };
}

export async function signOut() {
  const jar = await cookies();
  revokeToken(jar.get(COOKIE)?.value);
  jar.delete(COOKIE);
}
