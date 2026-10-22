// Typed client for the HonestBox API (server: lib/api.ts in the website repo).
import Constants from 'expo-constants';

// EXPO_PUBLIC_API_URL overrides the default (for example, a local server during development).
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL || (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl || 'https://honestbox.onrender.com';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;
export const setApiToken = (t: string | null) => { token = t; };
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

export async function api<T>(path: string, init: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1/${path}`, {
      method: init.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach HonestBox. Check your connection and try again.', 0, 'network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError((data as { error?: string }).error || 'Something went wrong. Try again.', res.status, (data as { code?: string }).code);
  }
  return data as T;
}

// ---------- shapes returned by the server ----------
export type Account = {
  user: { id: number; email: string; name: string; state: string; idVerified: boolean; isAdmin: boolean };
  balanceCents: number; testMode: boolean; boxesAllowedInState: boolean;
  referral: { code: string; level1: number; level2: number; pending: number; paid: number; thisMonth: number; l1Pct: number; l2Pct: number; windowDays: number; clearDays: number; monthlyCapCents: number };
};

export type BoxSummary = {
  slug: string; name: string; numeral: string; tagline: string; priceCents: number; expectedValueCents: number; houseEdge: number;
  top: { label: string; valueCents: number; oddsPpm: number } | null; bigOddsPpm: number; openable: boolean; closedReason: string | null;
};

export type BoxDetail = BoxSummary & {
  bands: { label: string; valueCents: number; oddsPpm: number; inStock: number }[];
  buyback: { creditPct: number; cashPct: number };
  fair: { serverSeedHash: string; clientSeed: string; nextNonce: number } | null;
};

export type Pull = {
  id: number; status: 'vault' | 'sold_back' | 'ship_requested' | 'shipped'; revealed: boolean; createdAt: string; holdUntil: string;
  box: { slug: string; name: string; priceCents: number }; band: { label: string; oddsPpm: number };
  watch: { brand: string; model: string; reference: string; year: number | null; sizeMm: number | null; condition: string; papers: string;
    marketCents: number; salesCount: number; salesLowCents: number | null; salesHighCents: number | null } | null;
  valueAtPullCents: number | null; lockedCents: number | null; lockedAt: string | null;
  buyback: { creditCents: number; cashCents: number; creditPct: number; cashPct: number; basis: 'locked' | 'market' } | null;
  shipFeeCents: number | null;
  fair: { serverSeedHash: string; clientSeed: string; nonce: number; rollPpm: number; serverSeed: string | null };
};

export type DropItem = {
  id: number; brand: string; model: string; reference: string; year: number | null; sizeMm: number | null; condition: string; papers: string;
  priceCents: number; marketCents: number; salesCount: number; authenticated: boolean;
  status: 'available' | 'held' | 'held_by_you' | 'sold'; heldUntil: string | null; boughtByYou: boolean;
};
export type Drop = { number: number; title: string; startsAt: string; endsAt: string; items: DropItem[] };

export type LedgerBox = { slug: string; name: string; priceCents: number; pulls: number; houseEdge: number; bands: { label: string; valueCents: number; oddsPpm: number; actual: number }[] };

export type Address = { name: string; line1: string; line2: string; city: string; state: string; zip: string };
