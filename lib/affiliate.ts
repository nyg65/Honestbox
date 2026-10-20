// Two-level affiliate program.
// Level 1: whoever referred the buyer earns aff_l1_bp of each box price during the buyer's first aff_window_days.
// Level 2: whoever referred that referrer earns aff_l2_bp on the same purchase.
// Commissions are pending for aff_clear_days, then post to the earner's credit. Each earner is capped per calendar month.
// Only box purchases pay commission, and a person can never earn on their own purchase.
import type { DatabaseSync } from 'node:sqlite';
import { db, tx, now } from './db.ts';

type S = Record<string, string>;
const n = (s: S, k: string) => Number(s[k]);

export function accrueCommissions(d: DatabaseSync, s: S, buyerId: number, pullId: number, priceCents: number) {
  const buyer = d.prepare('SELECT id, referred_by, created_at FROM users WHERE id = ?').get(buyerId) as { id: number; referred_by: number | null; created_at: string };
  if (!buyer?.referred_by) return;
  if (Date.now() - Date.parse(buyer.created_at) > n(s, 'aff_window_days') * 86400_000) return;
  const l1 = d.prepare('SELECT id, referred_by FROM users WHERE id = ?').get(buyer.referred_by) as { id: number; referred_by: number | null } | undefined;
  if (!l1) return;
  const availableAt = new Date(Date.now() + n(s, 'aff_clear_days') * 86400_000).toISOString();
  const monthStart = new Date().toISOString().slice(0, 7) + '-01';
  const pay = (earnerId: number, level: number, bp: number) => {
    if (earnerId === buyerId || bp <= 0) return;
    const earned = Number((d.prepare(`SELECT COALESCE(SUM(amount_cents),0) AS v FROM commissions WHERE earner_id = ? AND created_at >= ?`).get(earnerId, monthStart) as { v: number }).v);
    const room = n(s, 'aff_monthly_cap_cents') - earned;
    const amount = Math.min(Math.floor((priceCents * bp) / 10000), Math.max(0, room));
    if (amount <= 0) return;
    d.prepare(`INSERT INTO commissions(earner_id, buyer_id, pull_id, level, rate_bp, amount_cents, available_at, created_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run(earnerId, buyerId, pullId, level, bp, amount, availableAt, now());
  };
  pay(l1.id, 1, n(s, 'aff_l1_bp'));
  if (l1.referred_by) pay(l1.referred_by, 2, n(s, 'aff_l2_bp'));
}

/** Moves cleared commissions into the earner's credit. Safe to call on any page view. */
export function settleCommissions(userId: number) {
  const due = db().prepare(`SELECT COUNT(*) AS c FROM commissions WHERE earner_id = ? AND status = 'pending' AND available_at <= ?`).get(userId, now()) as { c: number };
  if (!Number(due.c)) return;
  tx((d) => {
    const rows = d.prepare(`SELECT id, level, amount_cents FROM commissions WHERE earner_id = ? AND status = 'pending' AND available_at <= ?`).all(userId, now()) as { id: number; level: number; amount_cents: number }[];
    for (const r of rows) {
      d.prepare(`UPDATE commissions SET status = 'paid' WHERE id = ?`).run(r.id);
      d.prepare(`INSERT INTO ledger(user_id, kind, amount_cents, memo, ref, created_at) VALUES (?,?,?,?,?,?)`)
        .run(userId, 'referral', r.amount_cents, `Referral commission, level ${r.level}`, `commission:${r.id}`, now());
    }
  });
}

export function affiliateSummary(userId: number) {
  const d = db();
  const v = (sql: string, ...a: unknown[]) => Number((d.prepare(sql).get(...(a as never[])) as { v: number }).v || 0);
  const me = d.prepare('SELECT referral_code FROM users WHERE id = ?').get(userId) as { referral_code: string };
  return {
    code: me.referral_code,
    level1: v(`SELECT COUNT(*) AS v FROM users WHERE referred_by = ?`, userId),
    level2: v(`SELECT COUNT(*) AS v FROM users WHERE referred_by IN (SELECT id FROM users WHERE referred_by = ?)`, userId),
    pending: v(`SELECT COALESCE(SUM(amount_cents),0) AS v FROM commissions WHERE earner_id = ? AND status = 'pending'`, userId),
    paid: v(`SELECT COALESCE(SUM(amount_cents),0) AS v FROM commissions WHERE earner_id = ? AND status = 'paid'`, userId),
    thisMonth: v(`SELECT COALESCE(SUM(amount_cents),0) AS v FROM commissions WHERE earner_id = ? AND created_at >= ?`, userId, new Date().toISOString().slice(0, 7) + '-01'),
  };
}

export function affiliateLeaders(limit = 50) {
  return db().prepare(`SELECT u.email, u.name, u.referral_code,
      (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.id) AS direct,
      COALESCE(SUM(CASE WHEN c.level = 1 THEN c.amount_cents END),0) AS l1,
      COALESCE(SUM(CASE WHEN c.level = 2 THEN c.amount_cents END),0) AS l2,
      COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.amount_cents END),0) AS pending
    FROM users u LEFT JOIN commissions c ON c.earner_id = u.id
    GROUP BY u.id HAVING direct > 0 OR l1 > 0 OR l2 > 0 ORDER BY (l1 + l2) DESC LIMIT ?`).all(limit) as Record<string, number | string>[];
}
