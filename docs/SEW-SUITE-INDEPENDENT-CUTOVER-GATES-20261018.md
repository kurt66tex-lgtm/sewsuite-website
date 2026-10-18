# Sew Suite independent-site production cutover gates
Last audited: 2026-10-18. This is a fail-closed checklist. Never switch DNS just because test Railway/Vercel environments say READY.

## Verified testing achievements
- Independent CRM Azure/Microsoft sign-in on stable Vercel alias.
- Isolated voice lead captured and visible as AI Voice in staff Inbox.
- Website, chat, voice synthetic intake transactional workflow coverage with held notices.
- Restricted database role, idempotency, encryption/backup, test mail transport.
- 2026-10-18 encrypted backup archive validated and remote decryption passed.

## Launch blockers in current WEBSITE SOURCE
1. `src/pages/BookService.jsx` returns 'Quote submissions are not yet enabled'; visitors cannot create real leads.
2. `src/pages/BookService.jsx` rejects artwork uploads; portfolio/artwork references cannot reach protected storage.
3. `api/intake.js` only accepts synthetic test keys and synthetic@example.invalid. A feature flag by itself cannot enable real customers.
4. `api/chat-lead.js` only accepts synthetic@example.invalid; real customer chat capture is off.
5. `src/api/base44Client.js` uses static `prelaunch-public-snapshot.json` and denies writes. Create a supported public settings/catalog data layer, with managed publishing or revalidation.
6. The staging site uses `noindex,nofollow` in index.html and Vercel headers and disallows all robots in robots.txt. Remove these only on the APPROVED production site with production-ready dynamic route/content/SEO validation.
7. `api/voice.js` is still staging scoped, including strict `.vercel.app` origin validation. The voice service is test-only, with a time/capacity limit. Build production voice auth, abuse limits, observability and CRM write/notification path separately.
8. Real Microsoft 365 acknowledgments/office notifications remain disabled. Existing test notifications may lack formatted subjects/bodies. Implement server-side templates, verified sender/recipient routing, dedupe ledger and delivery receipts before turning on.
9. Production data migration, consent/privacy handling, backups/restore, domain & SSL, GA4/Search Console parity, and rollback need independently signed-off checks.

## Release sequence
A. Make a distinct production database/tenant and private least-privilege application roles, never reuse rehearsal/synthetic state or administrator credentials.
B. Implement and test public Website Form -> backend validation -> CRM Inbox -> two formatted notifications, including real attachments.
C. Implement and test Chat -> confirmed CRM lead -> notifications, with abuse controls and dedupe.
D. Implement and test Voice -> confirmed CRM lead -> notifications with correct transcript/consent and honest failure replies.
E. Complete authenticated staff CRUD/project conversion, permissions, artwork links, and restore drills on the destination.
F. Compare every public page/content/title/meta/schema/canonical, verify analytics, sitemap, robots, mobile behavior and accessibility.
G. Route a supervised end-to-end internal test through the staging hostname without touching sewsuite.com.
H. Prepare documented old DNS values, TTL, TLS, rollback timings and monitoring; obtain explicit owner approval.
I. Switch DNS, validate endpoints/lead delivery and indexing, monitor failures, and preserve rollback ability until acceptance.

## Go/no-go
Run `npm run preflight:production` in this website repo. Block DNS cutover if ANY gate remains failing. Independently confirm production stack end-to-end: create real controlled lead, see it in CRM, get acknowledgments in authorized mailboxes, download real artwork, verify staff workflow, restore latest backup, and confirm SEO response headers.
