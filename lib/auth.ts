import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes, createHash } from 'node:crypto';
import { db, now, newReferralCode } from './db.ts';
import { verifyPassword, hashPassword } from './password.ts';
import { UserError, settings, excludedStates } from './engine.ts';

export type User = { id: number; email: string; name: string; role: string; state: string; id_verified: number };
const COOKIE = 'hb_session';
const DAYS = 30;
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const tok = jar.get(COOKIE)?.value;
  if (!tok) return null;
  const row = db().prepare(`SELECT u.id, u.email, u.name, u.role, u.state, u.id_verified FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).get(sha(tok), now()) as User | undefined;
  return row ?? null;
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
  const tok = randomBytes(32).toString('hex');
  const exp = new Date(Date.now() + DAYS * 86400_000);
  db().prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?,?,?)').run(sha(tok), userId, exp.toISOString());
  (await cookies()).set(COOKIE, tok, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: exp });
}

export async function signIn(email: string, password: string) {
  const u = db().prepare('SELECT id, pass_hash FROM users WHERE email = ?').get(email.trim().toLowerCase()) as { id: number; pass_hash: string } | undefined;
  if (!u || !verifyPassword(password, u.pass_hash)) throw new UserError('That email and password do not match.');
  await startSession(u.id);
}

export async function signUp(f: { email: string; name: string; password: string; state: string; adult: boolean; ref?: string }) {
  const email = f.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new UserError('Enter a valid email address.');
  if (!f.name.trim()) throw new UserError('Enter your name.');
  if (f.password.length < 8) throw new UserError('Use a password of at least 8 characters.');
  if (!/^[A-Z]{2}$/.test(f.state)) throw new UserError('Choose your state.');
  const s = settings();
  if (!f.adult) throw new UserError(`You must be ${s.min_age} or older to join HonestBox.`);
  if (db().prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new UserError('An account with that email already exists. Sign in instead.');
  let referredBy: number | null = null;
  const ref = (f.ref || '').trim().toUpperCase();
  if (ref) {
    const r = db().prepare('SELECT id FROM users WHERE referral_code = ?').get(ref) as { id: number } | undefined;
    if (!r) throw new UserError('That referral code was not found. Check it, or leave it blank.');
    referredBy = r.id;
  }
  const r = db().prepare('INSERT INTO users(email, name, pass_hash, state, created_at, referral_code, referred_by) VALUES (?,?,?,?,?,?,?)')
    .run(email, f.name.trim(), hashPassword(f.password), f.state, now(), newReferralCode(db()), referredBy);
  await startSession(Number(r.lastInsertRowid));
  return { boxesBlocked: excludedStates(s).includes(f.state) };
}

export async function signOut() {
  const jar = await cookies();
  const tok = jar.get(COOKIE)?.value;
  if (tok) db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(tok));
  jar.delete(COOKIE);
}

export const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
