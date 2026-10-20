// Provably fair draws.
// Before any pull, the customer sees SHA-256(serverSeed). Each pull uses
// HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`) to produce a roll from 0 to 999,999.
// When the customer rotates their seed, the old serverSeed is revealed, so every past
// pull can be re-computed by anyone. The same math runs in the browser on /fair.
import { createHash, createHmac, randomBytes } from 'node:crypto';

export const PPM = 1_000_000;

export const newServerSeed = () => randomBytes(32).toString('hex');
export const newClientSeed = () => randomBytes(8).toString('hex');
export const hashSeed = (seed: string) => createHash('sha256').update(seed).digest('hex');

function hmacFraction(serverSeed: string, message: string): number {
  const hex = createHmac('sha256', serverSeed).update(message).digest('hex');
  // 52 bits fits exactly in a JavaScript number
  return parseInt(hex.slice(0, 13), 16) / 2 ** 52;
}

/** The roll that picks the band: an integer from 0 to 999,999. */
export function rollPpm(serverSeed: string, clientSeed: string, nonce: number): number {
  return Math.floor(hmacFraction(serverSeed, `${clientSeed}:${nonce}`) * PPM);
}

/** Which physical watch inside the band: an index from 0 to count - 1. */
export function unitIndex(serverSeed: string, clientSeed: string, nonce: number, count: number): number {
  return Math.floor(hmacFraction(serverSeed, `${clientSeed}:${nonce}:unit`) * count);
}

export type OddsBand = { id: number; odds_ppm: number };

/** Bands are walked in display order; the roll lands in exactly one cumulative range. */
export function pickBand<T extends OddsBand>(bands: T[], roll: number): T {
  let edge = 0;
  for (const b of bands) {
    edge += b.odds_ppm;
    if (roll < edge) return b;
  }
  throw new Error('Odds do not add up to 100%');
}

export type EvBand = { value_cents: number; odds_ppm: number };

export function expectedValueCents(bands: EvBand[]): number {
  return Math.round(bands.reduce((s, b) => s + (b.value_cents * b.odds_ppm) / PPM, 0));
}

/** House edge as a fraction: 1 - EV / price. */
export function houseEdge(bands: EvBand[], priceCents: number): number {
  return priceCents > 0 ? 1 - expectedValueCents(bands) / priceCents : 0;
}
