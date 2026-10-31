# RRS Migration Factory — Base44 migration playbook

Checkpoint: October 31, 2026. Sew Suite is in prelaunch acceptance, not approved for domain cutover.

## Standard operating sequence

1. Inventory source Base44 public routes, media, SEO, structured data, forms, staff roles, CRM entities, chat, voice, telephone, email, integrations and consent policies.
2. Export and reconcile source entities and private files. Keep Base44 usable as rollback.
3. Establish isolated rehearsal and production resources. Use Vercel frontend, Railway API and restricted PostgreSQL roles, independent private artwork storage, offsite encrypted backups, and independent mail/voice providers.
4. Migrate website source and static assets to GitHub. Make a source-to-destination feature parity matrix. Keep prelaunch preview access-restricted and noindex.
5. Make customer-facing flows durable and idempotent: quote form, artwork, CRM record, notification outbox, customer receipt, office notice; chat and voice independently.
6. Verify authorized staff sign-in and restricted access, attachment downloads, CRM operations, and forbidden requests.
7. Verify all public routes, mobile layouts, local images, canonical URLs, sitemap, robots directives, GA4 host guard, runtime Base44 independence, and SEO parity.
8. Rehearse encrypted backup restoration into a separate environment, including actual private files and application readback.
9. Run production build and the website's explicit production preflight. Block release on any failure.
10. Prepare DNS/TLS/rollback plan; request explicit owner authorization. Only then switch domains and monitor end-to-end functionality. Do not delete Base44 during cutover.

## Reusable gate record

For every site record each gate as pending, passed with evidence, or blocked: catalog/version; source records and private assets; website/SEO; quote intake; notifications; chat; voice/telephone; staff CRM; abuse and role security; backup restore; preflight; domain cutover authorization. Store no secrets or customer-specific test records in the runbook.

## Sew Suite evidence, 2026-10-31

- Production public settings SQL transaction committed, with explicit parity PASS notice. Catalog version: e06f162d-8684-4eef-89fa-57bcec31a4fa. GA4: G-P20QB0KS6R. Independent social image: /sew-suite-hero.png. Portfolio: eight items.
- Approved independent comparison project is **sewsuite-authentic-comparison**, not the older independent-prelaunch project. Its home, services, robots.txt, and local social image served HTTP 200. Protected preview is noindex and robots disallow crawling.
- Railway production has successful deployments for CRM API, staff CRM, catalog, artwork, voice, mail and encrypted backup. Deployment success does not prove a functional launch.
- Protected synthetic quote: POST /internal/lead returned 202; artwork prepare and commit each returned 200. Controlled intake and delivery toggles were subsequently disabled.
- Authenticated Microsoft staff sign-in succeeded; staff API session, customers, projects and inbox returned 200; protected artwork download returned 200. A subsequent unauthenticated attempt returned 401.
- Daily backup on October 31 reported archive validated, remote upload, remote decryption PASS. Final-schema full restore with private artwork is still pending.
- Failure lessons: malformed connection URL can cause artwork gateway URIError, and older protected file reads failed before later success; diagnose and retest rather than treating one good deployment as adequate.

## Outstanding release gates

- Reconcile controlled lead, outbox and attached object metadata/hash directly with database and private storage evidence.
- Run full production cutover preflight and resolve all blocked checks.
- Test authorized customer/office mail delivery and dedupe, real intake, chat lead persistence, voice finalize, role-limited CRM workflows and page-by-page desktop/mobile fidelity.
- Restore final Postgres schema and private object data into isolated target and verify application readback.
- Obtain separate owner signoff for production release and domain reassignment. Preserve rollback to Base44.

## Terminal-context rule

When the prompt says `railway=#`, the user is in PostgreSQL psql, not PowerShell. Exit psql with `\q` before entering PowerShell commands; return to the correct Railway database connection to run SQL. SQL files may be run in psql with `\i` and their verified full paths. Avoid selecting the wrong Postgres service where multiple instances exist.

## Primary project references

See `docs/INDEPENDENT-SEW-SUITE-CUTOVER-ACCEPTANCE.md`, `docs/SEW-SUITE-INDEPENDENT-CUTOVER-GATES-20261018.md`, `docs/SYNTHETIC-QUOTE-ARTWORK-ACCEPTED-2026-10-31.md`, and `scripts/production-cutover-preflight.mjs`. These are evidence inputs, not automatic launch authorization.

## Verified SQL schema discovery, October 31

Owner ran a read-only `information_schema.tables` query in the intended Railway psql session (`railway=#`) and verified exactly these five matching application tables in schema `rrs_production`: `leads`, `lead_receipts`, `lead_workflow`, `artwork_intents`, and `outbox`. This is **schema discovery only**; record counts, column relationships, constraints, file hashes, and outbox delivery status have not yet been confirmed by this check. The next query must inspect column names and safe aggregate counts without displaying customer PII. Avoid guessing that attachments live in a table named `attachments` or `files`.

## Verified production table column inventory

Owner inspected `information_schema.columns` in Railway psql and returned 39 columns on five `rrs_production` tables:
- `leads`: tenant, id, request_key, payload (jsonb), created_at.
- `lead_receipts`: tenant, request_key, payload_hash, lead_id.
- `lead_workflow`: tenant, lead_id, version, status, updated_at, assigned_to, follow_up, close_reason.
- `artwork_intents`: tenant, id, lead_id, object_key, filename, content_type, size_bytes, sha256, state, created_at, committed_at.
- `outbox`: tenant, lead_id, kind, state, payload (jsonb), created_at, claim_token, claim_started_at, provider_state, updated_at, attempt_count.

The subsequent record-count attempt failed with `syntax error at or near "lead_workflow"` because the pasted statement began in the middle. This does **not** indicate table corruption or a failed migration. Provide a single SELECT with five scalar COUNT subqueries and await results. Avoid outputting payload JSON, filenames, object keys or user information in the acceptance record.
