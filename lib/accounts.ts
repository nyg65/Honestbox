// Accounts and sessions, without any web-framework code, so the website (cookies) and the app (bearer tokens) share them.
import { randomBytes, createHash } from 'node:crypto';
import { db, now, newReferralCode } from './db.ts';
import { verifyPassword, hashPassword } from './password.ts';
import { UserError, settings, excludedStates } from './engine.ts';

export type User = { id: number; email: string; name: string; role: string; state: string; id_verified: number };
export const SESSION_DAYS = 30;
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

export function issueToken(userId: number): { token: string; expires: Date } {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  db().prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?,?,?)').run(sha(token), userId, expires.toISOString());
  return { token, expires };
}

export function userByToken(token: string | undefined | null): User | null {
  if (!token) return null;
  const row = db().prepare(`SELECT u.id, u.email, u.name, u.role, u.state, u.id_verified FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).get(sha(token), now()) as User | undefined;
  return row ?? null;
}

export function revokeToken(token: string | undefined | null) {
  if (token) db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
}

export function checkCredentials(email: string, password: string): number {
  const u = db().prepare('SELECT id, pass_hash FROM users WHERE email = ?').get(String(email || '').trim().toLowerCase()) as { id: number; pass_hash: string } | undefined;
  if (!u || !verifyPassword(String(password || ''), u.pass_hash)) throw new UserError('That email and password do not match.');
  return u.id;
}

export type SignUpInput = { email: string; name: string; password: string; state: string; adult: boolean; ref?: string };

export function createAccount(f: SignUpInput): { userId: number; boxesBlocked: boolean } {
  const email = String(f.email || '').trim().toLowerCase();
  const name = String(f.name || '').trim();
  const password = String(f.password || '');
  const state = String(f.state || '').trim().toUpperCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new UserError('Enter a valid email address.');
  if (!name) throw new UserError('Enter your name.');
  if (password.length < 8) throw new UserError('Use a password of at least 8 characters.');
  if (!US_STATES.includes(state)) throw new UserError('Choose your state.');
  const s = settings();
  if (!f.adult) throw new UserError(`You must be ${s.min_age} or older to join HonestBox.`);
  if (db().prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new UserError('An account with that email already exists. Sign in instead.');
  let referredBy: number | null = null;
  const ref = String(f.ref || '').trim().toUpperCase();
  if (ref) {
    const r = db().prepare('SELECT id FROM users WHERE referral_code = ?').get(ref) as { id: number } | undefined;
    if (!r) throw new UserError('That referral code was not found. Check it, or leave it blank.');
    referredBy = r.id;
  }
  const r = db().prepare('INSERT INTO users(email, name, pass_hash, state, created_at, referral_code, referred_by) VALUES (?,?,?,?,?,?,?)')
    .run(email, name, hashPassword(password), state, now(), newReferralCode(db()), referredBy);
  return { userId: Number(r.lastInsertRowid), boxesBlocked: excludedStates(s).includes(state) };
}

export const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
