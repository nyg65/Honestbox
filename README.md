# HonestBox

The HonestBox website, customer web app and admin console in one Next.js app.
Customers open mystery boxes with published odds, reveal watches, sell them back or ship them,
and buy fixed-price weekly drops. Owners run inventory, odds, payouts, shipping and affiliates from `/admin`.

It runs in **test mode** today: no real money moves, and customers can add pretend credit to try it.

## Run it

Needs Node.js 22.5 or newer (it uses Node's built-in SQLite).

```bash
npm install
npm run build
npm start            # http://localhost:3000
npm test             # 17 engine tests: odds, fairness, buybacks, vault values, shipping, drops, affiliates
```

The database is created and filled with sample data on first start at `data/honestbox.db`.
Set `HB_DB_PATH` to put it elsewhere, and `HB_ADMIN_PASSWORD` before first start to choose the admin password.

| Account | Email | Password |
| --- | --- | --- |
| Admin | admin@honestbox.test | honest-abe-1860 (change before any real use) |
| Demo customer | demo@honestbox.test | demo-1234 |

## What's built

**Website and customer app** (works on phones; installable to the home screen)
- Landing page, sign-up with age and state checks, sign-in
- Five boxes, each with a published house edge of about 20%, full odds tables and expected value:
  I The Railsplitter $100 · II The Postmaster $250 · III The Counselor $500 · IV The Statesman $1,000 · V The President $2,000
- Stovepipe-hat reveal, then: sell back now as credit (market value minus 10%) or cash (85%, owner-approved, ID needed above $2,500), or ship insured
  (free for watches worth $250 or more; $15 below that, paid from credit)
- Vault values: a watch kept in the vault floats with the market, so the buyback is the market value on the day of sale minus 10%.
  Customers can instead lock in today's value (permanent: protected if prices fall, no gain if they rise).
  After 180 days a vault pull is sold back for credit at that day's value.
- Weekly drops with a 10-minute checkout hold
- My vault, account with credit history, the Honest Ledger (actual pulls against published odds), provably fair page with an in-browser verifier
- Two-level affiliate program: 5% of a referred customer's boxes for 90 days, 1% at level two, 30-day clearing, $2,500 monthly cap, no self-referrals, FTC disclosure reminder

**Admin console** (`/admin`)
- Overview: sales, credit owed to customers, buyback exposure, locked values against market, payouts waiting, items to ship
- Inventory: add watches, set market values, move watches between the vault and box bands
- Box editor with live odds total, expected value and house edge; refuses odds that don't add up to 100%
- Cash payout approvals, shipping queue with tracking, drops, settings, affiliate leaderboard, manual credit (free entries), ID verification, audit log

**Rules the system enforces**
- A box cannot be opened unless every prize band on its odds table has a watch in stock.
- Every pull is provably fair: the server seed hash is shown before the pull and revealed later.
- A sold-back watch returns to its band, so published odds stay stocked.
- Boxes can be switched off in one click (drops keep running), and are closed in the excluded states.
- Every credit change is a ledger row; every owner action is in the audit log.

## Deploy on Render (test mode)

`render.yaml` defines everything: one Node web service on the Starter plan with a 1 GB persistent disk at `/var/data` for the database.

1. In Render, choose **New > Blueprint** and pick this GitHub repository.
2. Set `HB_ADMIN_PASSWORD` to a strong password of 12 or more characters. On Render there is no default: until it is set, the site runs with no admin account. Sign in as admin@honestbox.test with that password.
3. Deploy. Every push to `main` redeploys automatically.

The free plan has no disk, so it would erase every account and pull on each restart. Stay on Starter or higher.

## Before real money (in this order)

1. **Gaming attorney opinion.** Sets the excluded states, the official rules, the free-entry method and the terms. The legal pages are marked as drafts.
2. **Payment processor** (one that approves this category). Connect card payments for adding credit, and payouts for approved cash buybacks. `real_money` stays off until then.
3. **Identity checks** (an identity-verification service) for cash payouts and age.
4. **Hosting:** a managed Node host plus a managed Postgres database. SQLite is fine for testing; move to Postgres before launch.
5. **Market data:** connect a price source so watch values update automatically instead of by hand.
6. **Security review** by an independent firm before launch.
7. **App stores:** the site installs to a phone home screen today. Wrapping it for the Apple App Store and Google Play is the next build step, and needs developer accounts in HonestBox's name.

## Code map

- `lib/engine.ts`: boxes, pulls, buybacks, shipping, drops, the Honest Ledger
- `lib/fair.ts`: provably fair math (the same math runs in the browser in `components/Verifier.tsx`)
- `lib/affiliate.ts`: two-level commissions
- `lib/admin.ts`: owner operations, all audited
- `lib/db.ts`: schema, settings defaults and sample data
- `app/`: pages; `app/actions.ts`: every form submission
- `tests/engine.test.ts`: the rule tests
