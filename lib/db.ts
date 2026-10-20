// HonestBox data layer: one SQLite file, created and seeded on first use.
// Money is always stored in integer cents. Odds are stored in parts per million (ppm).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { hashPassword } from './password.ts';
import { randomBytes } from 'node:crypto';

const DB_PATH = resolve(process.env.HB_DB_PATH || 'data/honestbox.db');

type G = { __hbdb?: DatabaseSync };
const g = globalThis as unknown as G;

export function db(): DatabaseSync {
  if (!g.__hbdb) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    const d = new DatabaseSync(DB_PATH);
    d.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    migrate(d);
    seedIfEmpty(d);
    fillReferralCodes(d);
    g.__hbdb = d;
  }
  return g.__hbdb;
}

/** Run fn inside one write transaction; rolls back on any error. */
export function tx<T>(fn: (d: DatabaseSync) => T): T {
  const d = db();
  d.exec('BEGIN IMMEDIATE');
  try {
    const out = fn(d);
    d.exec('COMMIT');
    return out;
  } catch (e) {
    d.exec('ROLLBACK');
    throw e;
  }
}

export const now = () => new Date().toISOString();

function migrate(d: DatabaseSync) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    pass_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    state TEXT NOT NULL,
    id_verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at TEXT NOT NULL
  );
  -- Every change to a user's HonestBox credit is one signed row. Balance = SUM(amount_cents).
  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    kind TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    memo TEXT NOT NULL,
    ref TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS boxes (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    numeral TEXT NOT NULL,
    tagline TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS bands (
    id INTEGER PRIMARY KEY,
    box_id INTEGER NOT NULL REFERENCES boxes(id),
    label TEXT NOT NULL,
    value_cents INTEGER NOT NULL,
    odds_ppm INTEGER NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS watches (
    id INTEGER PRIMARY KEY,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    reference TEXT NOT NULL DEFAULT '',
    year INTEGER,
    size_mm INTEGER,
    condition TEXT NOT NULL DEFAULT 'Very good',
    papers TEXT NOT NULL DEFAULT 'Box and papers',
    market_cents INTEGER NOT NULL,
    cost_cents INTEGER NOT NULL,
    sales_count INTEGER NOT NULL DEFAULT 0,
    sales_low_cents INTEGER,
    sales_high_cents INTEGER,
    -- stock: in a box band, waiting in the vault, pulled by a customer, in a drop, shipped or sold
    status TEXT NOT NULL DEFAULT 'vault',
    band_id INTEGER REFERENCES bands(id),
    authenticated INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  -- Provably fair seeds: the server seed's SHA-256 hash is shown before any pull; the seed itself is revealed on rotation.
  CREATE TABLE IF NOT EXISTS seeds (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    server_seed TEXT NOT NULL,
    server_hash TEXT NOT NULL,
    client_seed TEXT NOT NULL,
    next_nonce INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    revealed_at TEXT
  );
  CREATE TABLE IF NOT EXISTS pulls (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    box_id INTEGER NOT NULL REFERENCES boxes(id),
    band_id INTEGER NOT NULL REFERENCES bands(id),
    watch_id INTEGER NOT NULL REFERENCES watches(id),
    price_cents INTEGER NOT NULL,
    value_cents INTEGER NOT NULL,
    seed_id INTEGER NOT NULL REFERENCES seeds(id),
    nonce INTEGER NOT NULL,
    roll_ppm INTEGER NOT NULL,
    odds_snapshot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'vault',
    hold_until TEXT NOT NULL,
    revealed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS buybacks (
    id INTEGER PRIMARY KEY,
    pull_id INTEGER NOT NULL UNIQUE REFERENCES pulls(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    method TEXT NOT NULL,
    rate_bp INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    decided_at TEXT
  );
  CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    watch_id INTEGER NOT NULL REFERENCES watches(id),
    source TEXT NOT NULL,
    source_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    tracking TEXT,
    created_at TEXT NOT NULL,
    shipped_at TEXT
  );
  CREATE TABLE IF NOT EXISTS drops (
    id INTEGER PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS drop_items (
    id INTEGER PRIMARY KEY,
    drop_id INTEGER NOT NULL REFERENCES drops(id),
    watch_id INTEGER NOT NULL UNIQUE REFERENCES watches(id),
    price_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    held_by INTEGER REFERENCES users(id),
    held_until TEXT,
    sold_to INTEGER REFERENCES users(id),
    sold_at TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audit (
    id INTEGER PRIMARY KEY,
    actor_id INTEGER,
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  -- Two-level affiliate commissions. Held as pending until the clearing period ends, then posted to the ledger as credit.
  CREATE TABLE IF NOT EXISTS commissions (
    id INTEGER PRIMARY KEY,
    earner_id INTEGER NOT NULL REFERENCES users(id),
    buyer_id INTEGER NOT NULL REFERENCES users(id),
    pull_id INTEGER NOT NULL REFERENCES pulls(id),
    level INTEGER NOT NULL,
    rate_bp INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    available_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_comm_earner ON commissions(earner_id, status);
  CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger(user_id);
  CREATE INDEX IF NOT EXISTS idx_pulls_user ON pulls(user_id);
  CREATE INDEX IF NOT EXISTS idx_pulls_box ON pulls(box_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_watches_band ON watches(band_id, status);
  `);
  // Columns added after the first release.
  const cols = (d.prepare(`PRAGMA table_info(users)`).all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes('referral_code')) d.exec(`ALTER TABLE users ADD COLUMN referral_code TEXT`);
  if (!cols.includes('referred_by')) d.exec(`ALTER TABLE users ADD COLUMN referred_by INTEGER REFERENCES users(id)`);
  d.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_ref ON users(referral_code)`);
}

function fillReferralCodes(d: DatabaseSync) {
  const missing = d.prepare(`SELECT id FROM users WHERE referral_code IS NULL`).all() as { id: number }[];
  for (const u of missing) d.prepare(`UPDATE users SET referral_code = ? WHERE id = ?`).run(newReferralCode(d), u.id);
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newReferralCode(d: DatabaseSync): string {
  for (;;) {
    const bytes = randomBytes(6);
    const code = Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
    if (!d.prepare('SELECT 1 FROM users WHERE referral_code = ?').get(code)) return code;
  }
}

export const DEFAULT_SETTINGS: Record<string, string> = {
  boxes_enabled: '1',           // master switch for mystery boxes (attorney gate)
  real_money: '0',              // 0 = test mode: no real payments, "Add test credit" is available
  buyback_credit_bp: '9000',    // 90% of market value as HonestBox credit
  buyback_cash_bp: '8500',      // 85% of market value as cash
  cash_id_threshold_cents: '250000', // cash payouts over $2,500 need a verified ID
  hold_days: '30',              // days a pull can sit in the vault before the customer must choose
  drop_hold_minutes: '10',
  excluded_states: 'WA,ID,MI,NV,CT', // placeholder list until the attorney's opinion
  min_age: '18',
  aff_l1_bp: '500',                 // level 1: 5% of a referred customer's box purchases
  aff_l2_bp: '100',                 // level 2: 1% on customers referred by your referrals
  aff_window_days: '90',            // commissions only on a customer's first 90 days
  aff_clear_days: '30',             // commissions become spendable credit after 30 days
  aff_monthly_cap_cents: '250000',  // most any one affiliate can earn in a calendar month
};

function seedIfEmpty(d: DatabaseSync) {
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    d.prepare('INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)').run(k, v);
  }
  const has = d.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
  if (has.n > 0) return;
  const t = now();
  d.exec('BEGIN');
  try {
    const admin = d.prepare(`INSERT INTO users(email, name, pass_hash, role, state, id_verified, created_at) VALUES (?,?,?,?,?,?,?)`)
      .run('admin@honestbox.test', 'HonestBox Admin', hashPassword(process.env.HB_ADMIN_PASSWORD || 'honest-abe-1860'), 'admin', 'TX', 1, t);
    const demo = d.prepare(`INSERT INTO users(email, name, pass_hash, role, state, id_verified, created_at) VALUES (?,?,?,?,?,?,?)`)
      .run('demo@honestbox.test', 'Demo Collector', hashPassword('demo-1234'), 'user', 'TX', 0, t);
    d.prepare(`INSERT INTO ledger(user_id, kind, amount_cents, memo, created_at) VALUES (?,?,?,?,?)`)
      .run(demo.lastInsertRowid, 'test_credit', 250000, 'Test credit (no real money)', t);
    void admin;

    const box = d.prepare(`INSERT INTO boxes(slug, name, numeral, tagline, price_cents, sort) VALUES (?,?,?,?,?,?)`);
    const band = d.prepare(`INSERT INTO bands(box_id, label, value_cents, odds_ppm, sort) VALUES (?,?,?,?,?)`);
    const watch = d.prepare(`INSERT INTO watches(brand, model, reference, year, size_mm, condition, papers, market_cents, cost_cents, sales_count, sales_low_cents, sales_high_cents, status, band_id, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

    // Sample catalog. Values are placeholders until live market data is connected.
    const W = {
      sub: ['Rolex', 'Submariner Date', '126610LN', 2022, 41, 1500000],
      speedy: ['Omega', 'Speedmaster Professional', '310.30.42.50.01.001', 2021, 42, 800000],
      bb58: ['Tudor', 'Black Bay 58', '79030N', 2021, 39, 350000],
      prx: ['Tissot', 'PRX Powermatic 80', 'T137.407.11.041.00', 2023, 40, 70000],
      khaki: ['Hamilton', 'Khaki Field Auto', 'H70455133', 2022, 38, 68000],
      jazz: ['Hamilton', 'Jazzmaster Viewmatic', 'H32515135', 2022, 40, 72000],
      gent: ['Tissot', 'Gentleman Powermatic 80', 'T127.407.11.041.00', 2022, 40, 55500],
      seiko5: ['Seiko', '5 Sports', 'SRPD55', 2023, 42, 22000],
      promaster: ['Citizen', 'Promaster Dive', 'BN0151-09L', 2022, 44, 22500],
      bambino: ['Orient', 'Bambino V2', 'FAC00009N0', 2023, 41, 11600],
      snk: ['Seiko', 'SNK809', 'SNK809', 2021, 37, 11600],
    } as const;
    const add = (key: keyof typeof W, bandId: number | bigint, n: number) => {
      const [brand, model, ref, year, size, mkt] = W[key];
      for (let i = 0; i < n; i++) {
        watch.run(brand, model, ref, year, size, 'Very good', 'Box and papers', mkt, Math.round(mkt * 0.92), 12,
          Math.round(mkt * 0.95), Math.round(mkt * 1.06), 'in_box', bandId, t);
      }
    };

    // The Railsplitter, $250, published edge 20%
    const b1 = box.run('railsplitter', 'The Railsplitter', 'I', 'Seiko, Hamilton, Tissot and up', 25000, 1).lastInsertRowid;
    add('speedy', band.run(b1, 'Omega Speedmaster Professional', 800000, 2000, 1).lastInsertRowid, 1);
    add('bb58', band.run(b1, 'Tudor Black Bay 58', 350000, 10000, 2).lastInsertRowid, 2);
    const r3 = band.run(b1, 'Hamilton, Tissot', 70000, 60000, 3).lastInsertRowid; add('prx', r3, 3); add('khaki', r3, 3);
    const r4 = band.run(b1, 'Seiko, Orient', 11600, 928000, 4).lastInsertRowid; add('snk', r4, 10); add('bambino', r4, 10);

    // The Statesman, $750
    const b2 = box.run('statesman', 'The Statesman', 'II', 'Top pull: Rolex Submariner Date', 75000, 2).lastInsertRowid;
    add('sub', band.run(b2, 'Rolex Submariner Date', 1500000, 4000, 1).lastInsertRowid, 1);
    add('speedy', band.run(b2, 'Omega Speedmaster Professional', 800000, 12000, 2).lastInsertRowid, 2);
    add('bb58', band.run(b2, 'Tudor Black Bay 58', 350000, 40000, 3).lastInsertRowid, 3);
    const s4 = band.run(b2, 'Hamilton, Tissot', 70000, 200000, 4).lastInsertRowid; add('prx', s4, 4); add('jazz', s4, 4);
    const s5 = band.run(b2, 'Seiko, Citizen', 22100, 744000, 5).lastInsertRowid; add('seiko5', s5, 10); add('promaster', s5, 10);

    // The President, $2,000
    const b3 = box.run('president', 'The President', 'III', '1 in 5 pulls is worth $3,500 or more', 200000, 3).lastInsertRowid;
    add('sub', band.run(b3, 'Rolex Submariner Date', 1500000, 15000, 1).lastInsertRowid, 2);
    add('speedy', band.run(b3, 'Omega Speedmaster Professional', 800000, 50000, 2).lastInsertRowid, 3);
    add('bb58', band.run(b3, 'Tudor Black Bay 58', 350000, 140000, 3).lastInsertRowid, 5);
    const p4 = band.run(b3, 'Hamilton, Tissot', 70000, 300000, 4).lastInsertRowid; add('prx', p4, 5); add('khaki', p4, 5);
    add('gent', band.run(b3, 'Tissot Gentleman', 55500, 495000, 5).lastInsertRowid, 12);

    // Drop No. VII
    const start = new Date(); const end = new Date(Date.now() + 1000 * 60 * 60 * 62);
    const drop = d.prepare(`INSERT INTO drops(number, title, starts_at, ends_at) VALUES (?,?,?,?)`).run(7, 'Drop No. VII', start.toISOString(), end.toISOString()).lastInsertRowid;
    const dropItem = d.prepare(`INSERT INTO drop_items(drop_id, watch_id, price_cents) VALUES (?,?,?)`);
    const dw = (brand: string, model: string, ref: string, year: number, size: number, mkt: number, price: number, papers: string, cond: string) => {
      const id = watch.run(brand, model, ref, year, size, cond, papers, mkt, Math.round(mkt * 0.9), 14, Math.round(mkt * 0.96), Math.round(mkt * 1.05), 'drop', null, t).lastInsertRowid;
      dropItem.run(drop, id, price);
    };
    dw('Rolex', 'Datejust 41', '126300', 2022, 41, 1060600, 1045000, 'Box and papers', 'Excellent');
    dw('Omega', 'Seamaster Diver 300M', '210.30.42.20.03.001', 2021, 42, 425000, 415000, 'Box and papers', 'Very good');
    dw('Cartier', 'Santos, medium', 'WSSA0029', 2020, 35, 600000, 590000, 'Papers only', 'Very good');

    d.prepare('INSERT INTO audit(actor_id, action, detail, created_at) VALUES (?,?,?,?)').run(null, 'seed', 'Sample data created', t);
    d.exec('COMMIT');
  } catch (e) {
    d.exec('ROLLBACK');
    throw e;
  }
}
