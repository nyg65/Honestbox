# HonestBox: move to AWS

Tracker for moving honest-box.com's DNS from GoDaddy to Route 53, then moving the site off Render into AWS account 917680159542.

Status key: **Not started** · **In progress** · **Blocked** · **Done**
Owners: **John**, **Max**, **Claude** (Claude does AWS and code work through the connected AWS account; anything involving GoDaddy logins, payment or legal sign-off stays with John or Max).

Last updated: November 17, 2026 (afternoon)

## Where things stand

| Item | Today | Checked |
|---|---|---|
| Domain registrar | GoDaddy (honest-box.com) | As told by John |
| DNS | **Route 53** (nameservers switched at GoDaddy Nov 17; GoDaddy stays registrar) | Nov 17 |
| Website, admin, app API | Render, free plan: `honestbox.onrender.com`, auto-deploys from GitHub `nyg65/Honestbox` `main` | Nov 17 |
| Database | SQLite file on the Render server; wiped on every deploy (free plan, no disk) | Nov 17 |
| Watch photos | Files on the Render server; also wiped on every deploy | Nov 17 |
| AWS account | 917680159542: Route 53 zone Z0717949LR359TMD2QLY; certificate for honest-box.com and *.honest-box.com issued (us-east-1); no S3 buckets yet | Nov 17 |
| AWS access for Claude | IAM user `claude` with **AdministratorAccess** (more than needed; see 0.3) | Nov 17 |
| Phone app | Points at `https://honestbox.onrender.com` (`mobile/app.json`, `extra.apiUrl`) | Nov 17 |

## Decisions

| # | Decision | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | AWS region | us-east-1 (N. Virginia), us-east-2 (Ohio), us-west-2 (Oregon) | **us-east-2**: close to Texas, full service coverage. Certificates for CloudFront still live in us-east-1. | **Decided: us-east-1** |
| D2 | Hosting setup for launch | **A.** One small EC2 server (or Lightsail) running the site in Docker, SQLite on an attached disk, photos in S3. **B.** ECS Fargate containers + RDS Postgres + S3. | **A** for launch: closest to today's code, roughly $15–40 a month, no database rewrite. Move to **B** before real-money volume needs more than one server. | **Decided: A** |
| D3 | Web address layout | `honest-box.com` for the site, `www` redirects to it, `api.honest-box.com` for the app, `staging.honest-box.com` for testing | As listed | **Decided: as listed, including staging** |
| D4 | Move the domain registration itself to Route 53? | Keep GoDaddy as registrar (only DNS moves), or transfer registration | Keep GoDaddy for now; transfer later if wanted (one-year renewal is included in a transfer) | **Decided: GoDaddy stays registrar; DNS moves to Route 53** |
| D5 | Email on honest-box.com | None yet; Google Workspace; Microsoft 365; Amazon SES for sending receipts only | Decide before DNS moves so MX/SPF/DKIM records go in once | **Postponed** |
| D6 | Monthly AWS budget alert | e.g. $50, $100, $250 | $100 to start | **Decided: $100** |

## Phase 0: Account safety

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 0.1 | Turn on MFA for the AWS root user; store root credentials offline | John | Not started | Root should never be used day to day |
| 0.2 | Budget alert at the D6 amount, emailed to John and Max | Claude | Not started | AWS Budgets |
| 0.3 | Replace `claude`'s AdministratorAccess with a policy limited to the services this migration uses | Claude, approved by John | Not started | Route 53, ACM, S3, EC2/ECR, CloudFront, Secrets Manager, CloudWatch, IAM for the app's own role |
| 0.4 | Turn on CloudTrail (one trail, all regions) so every change is logged | Claude | Not started | |
| 0.5 | Tag everything `project=honestbox`, `env=prod` or `env=staging` for cost tracking | Claude | Not started | |

## Phase 1: DNS from GoDaddy to Route 53

Goal: Route 53 answers for honest-box.com with exactly the records GoDaddy has today, plus records for the site. Nothing should go down.

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 1.1 | Export the zone file from GoDaddy (Domain > DNS > Export) and send it to Claude | John | **Done** | Screenshot instead of export: parked A record, www CNAME to the bare domain, GoDaddy's _domainconnect helper, GoDaddy NS and SOA. Nothing in use. |
| 1.2 | Note whether DNSSEC is on at GoDaddy | John | Not started | If on, turn it off at GoDaddy before 1.7, or the domain stops resolving |
| 1.3 | Create the honest-box.com hosted zone in Route 53 | Claude | **Done** | Zone Z0717949LR359TMD2QLY. Nameservers: ns-493.awsdns-61.com, ns-1825.awsdns-36.co.uk, ns-974.awsdns-57.net, ns-1419.awsdns-49.org. About $0.50 a month plus queries |
| 1.4 | Recreate every GoDaddy record in Route 53; drop GoDaddy's parking records | Claude | **Done** | Nothing needed copying: parking, www-to-parking and _domainconnect were GoDaddy-only. One record on GoDaddy's page 2 was not seen. |
| 1.5 | Add site records: `honest-box.com`, `www`, `api`, `staging` pointing to Render for now | Claude | Not started | Render custom domains: add them in Render first, then use the targets Render shows |
| 1.6 | Lower TTLs at GoDaddy to 300 seconds a day before the switch | John | **Skipped** | Not needed: the domain was parked |
| 1.7 | Change honest-box.com's nameservers at GoDaddy to the four Route 53 nameservers | John | **Done** | Nov 17. Delete the four awsdns NS records that were also added inside GoDaddy's record list (harmless, but misleading) |
| 1.8 | Verify: nameservers, every record, email delivery, HTTPS on the site | Claude | **In progress** | Delegation confirmed Nov 17: AWS validated the certificate through Route 53 within 20 seconds. Site records and HTTPS still to do (1.5). No email yet (D5). |
| 1.9 | Turn DNSSEC back on, now signed by Route 53 (optional) | Claude | Not started | Then add the DS record at GoDaddy |

Rollback: point the nameservers back to GoDaddy's at GoDaddy. Leave the GoDaddy records untouched until 1.8 passes.

## Phase 2: AWS foundation

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 2.1 | Private S3 bucket for watch photos, encrypted, versioned, no public access | Claude | Not started | Fixes photos being wiped on deploy, even before the move |
| 2.2 | Change the site's photo storage from local files to S3 | Claude | Not started | Code change plus a test |
| 2.3 | CloudFront in front of the photos at `img.honest-box.com` | Claude | Not started | Fast loading; bucket stays private |
| 2.4 | TLS certificates in ACM for honest-box.com and its subdomains, validated by DNS | Claude | **Done** | us-east-1, covers honest-box.com and *.honest-box.com (www, api, staging, img). Renews automatically while its validation record stays in Route 53. |
| 2.5 | Secrets Manager for the admin password and future keys (payments, EveryWatch) | Claude; values entered by John | Not started | Values are never typed in chat |
| 2.6 | S3 bucket for database backups, with a 90-day expiry | Claude | Not started | |

## Phase 3: Build the AWS home for the site

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 3.1 | Dockerfile for the site (Node 22, Next.js production build) | Claude | Not started | |
| 3.2 | Infrastructure written as code (AWS CDK or CloudFormation) in the repo | Claude | Not started | Repeatable; staging and production match |
| 3.3 | Server, network and security groups per D2 | Claude | Not started | Only ports 80 and 443 open to the internet |
| 3.4 | Load balancer or CloudFront in front of the site, with the ACM certificate | Claude | Not started | HTTPS only; HTTP redirects |
| 3.5 | Persistent disk for the SQLite database, with nightly backups to the 2.6 bucket | Claude | Not started | Restore tested once |
| 3.6 | Deploys from GitHub: push to `main` builds and deploys (GitHub Actions with AWS OIDC, no stored keys) | Claude | Not started | Replaces Render's auto-deploy |
| 3.7 | Monitoring: health check, uptime alarm, error-log alarm, emails to John and Max | Claude | Not started | CloudWatch |
| 3.8 | Stand up `staging.honest-box.com` and run the full test suite and browser checks against it | Claude | Not started | |

## Phase 4: Cutover

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 4.1 | Agree a cutover window | John, Max | Not started | Before launch, Render data is test data only |
| 4.2 | Copy any data worth keeping from Render | Claude | Not started | Today nothing: the free plan wipes it anyway |
| 4.3 | Point `honest-box.com`, `www` and `api` at AWS in Route 53 | Claude | Not started | TTL 300 for quick rollback |
| 4.4 | Check sign-in, boxes, vault, drops, admin, photos and the app API on the live address | Claude | Not started | |
| 4.5 | Point the phone app at `https://api.honest-box.com` and build new app versions | Claude | Not started | `mobile/app.json` |
| 4.6 | Keep Render running for one week as a fallback, then delete the service | Claude, approved by John | Not started | |

## Phase 5: Before real money

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 5.1 | Move to D2 option B (RDS Postgres, more than one server) if volume needs it | Claude | Not started | |
| 5.2 | Web application firewall (AWS WAF) with rate limits on sign-in and box opening | Claude | Not started | |
| 5.3 | Transactional email (receipts, sign-in links) through Amazon SES with SPF, DKIM and DMARC | Claude | Not started | Depends on D5 |
| 5.4 | Review of payment, ID-verification and data-retention requirements with the attorney | John, Max | Not started | |

## Log

| Date | What happened |
|---|---|
| Nov 17, 2026 | Nameservers switched at GoDaddy. Certificate for honest-box.com and *.honest-box.com requested and issued in us-east-1 (validation CNAME added to Route 53), which confirms Route 53 is live. |
| Nov 17, 2026 | Decisions: us-east-1, single server (A), addresses as listed with staging, GoDaddy stays registrar, email postponed, $100 budget alert. Route 53 zone created (Z0717949LR359TMD2QLY), tagged project=honestbox, env=prod. |
| Nov 17, 2026 | AWS account connected. Checked: no Route 53 zones, domains, certificates or buckets yet; `claude` user has AdministratorAccess. Tracker created. |
