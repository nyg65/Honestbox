// Helpers for server actions: turn a known UserError into a message on the page.
import { redirect } from 'next/navigation';
import { UserError } from './engine.ts';

export function back(path: string, key: 'error' | 'ok', msg: string): never {
  const sep = path.includes('?') ? '&' : '?';
  redirect(`${path}${sep}${key}=${encodeURIComponent(msg)}`);
}

/** Runs fn; a UserError becomes ?error=… on `path`. Anything else is a real bug and is rethrown. */
export function attempt<T>(path: string, fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof UserError) back(path, 'error', e.message);
    throw e;
  }
}

export async function attemptAsync<T>(path: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof UserError) back(path, 'error', e.message);
    throw e;
  }
}

export const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
export const int = (f: FormData, k: string) => Number.parseInt(String(f.get(k) ?? ''), 10);
