---
name: base44-independent-migration
description: Repeatably migrate a Base44-built service business website to independent Vercel frontend and Railway backend without premature DNS cutover.
---

# Base44 Independent Migration

Use this skill for Service Trade Agency customer websites. Read `docs/RRS-MIGRATION-FACTORY-STATUS.md` for the live Sew Suite example and `scripts/production-cutover-preflight.mjs` for actual release gates.

## Procedure

1. Inventory Base44 pages, metadata, media, data model, staff roles, CRM, chat, voice, mail, forms and integrations. Capture baseline screenshots at native aspect ratios and compare recorded record counts.
2. Preserve source exports and rollback. Provision separate Railway testing and production resources with least-privilege Postgres roles, encrypted offsite backup and private file storage. Do not disclose secret values.
3. Migrate frontend to GitHub/Vercel, maintain independently versioned public catalog and local media. Protect previews from indexing and live analytics.
4. Implement persistent CRM intake, proof/artwork, staff authorization, notification outbox, and isolated chat/voice. Rate-limit, verify consent/captcha, dedupe and record explicit durable receipts.
5. Run frontend test suite and source preflight, live API readiness, protected staff readback, denied-access checks, delivery receipts, idempotent replay and isolated backup restore.
6. Confirm source-vs-destination visual/SEO route parity, independence from Base44 SDK and runtime APIs, and responsive usability.
7. Produce evidence-based go/no-go matrix. Request explicit authorization before any live DNS, customer delivery, paid voice/SIP or write enablement.
8. On authorization, record prior DNS and domain assignment, switch only to approved Vercel project, verify TLS, apex/WWW, SEO index rules, CRM leads and notices, voice and monitored rollback. Keep Base44 for fallback.

## Checkpoint notation

Use PASS only for evidence observed in the current target environment. Mark a check PENDING when code exists but the real workflow has not been exercised. Record failing tests and the verified fix, not just the error.

## Windows operator instructions

When the operator sees `railway=#`, they are inside psql. Provide psql-only instructions. To execute PowerShell, first have them enter `\q`; to resume SQL, reconnect to the intended Railway PostgreSQL service. Use verified full file paths when invoking SQL scripts.

## Sew Suite caveat

The approved website deployment is `sewsuite-authentic-comparison`, not `sewsuite-independent-prelaunch`. Do not move `sewsuite.com` or `www.sewsuite.com` without the owner's explicit final approval.
