import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const N = 16384, R = 8, P = 1, LEN = 64;

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const h = scryptSync(pw, salt, LEN, { N, r: R, p: P });
  return `scrypt$${salt.toString('base64')}$${h.toString('base64')}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [alg, s, h] = stored.split('$');
  if (alg !== 'scrypt' || !s || !h) return false;
  const want = Buffer.from(h, 'base64');
  const got = scryptSync(pw, Buffer.from(s, 'base64'), want.length, { N, r: R, p: P });
  return got.length === want.length && timingSafeEqual(got, want);
}
