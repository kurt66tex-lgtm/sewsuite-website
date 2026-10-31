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

## Production aggregate reconciliation checkpoint — October 31, 2026

The owner reran a read-only scalar-subquery count at `railway=#` and received `leads=2, receipts=2, workflows=2, artwork=1, notifications=0` for `rrs_production`. The preceding fragmented UNION query failed only due to partial pasted SQL; the corrected query succeeded. Counts alone **do not prove** matching IDs, tenant isolation, committed artwork, unique receipts, or mail readiness. Outbox zero is observed while outbound mail remains gated; treat the customer/office notification path as unverified, not passed. Next: tenant-scoped orphan checks, duplicates, workflow and artwork state breakdowns without displaying lead payload PII; then independently validate object SHA-256 and mail delivery under authorized controlled tests.

## Production referential integrity verification — October 31, 2026

Owner ran five read-only count checks in `rrs_production` and all returned **zero**: `leads_missing_receipts=0`, `orphan_receipts=0`, `leads_missing_workflows=0`, `orphan_artwork=0`, `artwork_needing_review=0`. The checks join by tenant, lead ID and (for receipts) request key; artwork review requires state `committed`, non-null committed timestamp, and SHA-256 length 64. **Passed:** observed relationship and metadata checks against current records. **Not yet established:** uniqueness constraints, actual private object byte SHA-256 and successful customer/office notification delivery (outbox currently empty). Preserve the distinction in subsequent migration acceptance decisions.

## Duplicate-key and artwork-metadata validation — 2026-10-31

Owner executed read-only aggregate SQL against the five `rrs_production` tables and verified: `duplicate_lead_keys=0`, `duplicate_receipt_keys=0`, `duplicate_workflows=0`, `committed_artwork=1`, `invalid_artwork_hashes=0`. These are PASS results for the current dataset. They do not establish unique constraints for future writes, actual R2 object bytes matching the stored SHA-256, or delivery of customer/office notices. Next inspect `pg_constraint` / `pg_indexes` read-only, then verify private object content hash with an authorized file fetch, without printing object keys or customer data.

## Database uniqueness constraints verified — October 31, 2026

Owner queried `pg_index`, `pg_class`, and `pg_namespace` for the five production reconciliation tables. Seven unique B-tree indexes confirmed: `artwork_intents_object_key_key` on `(object_key)`; `artwork_intents_pkey` on `(id)`; `lead_receipts_pkey` on `(tenant, request_key)`; `lead_workflow_pkey` on `(tenant, lead_id)`; `leads_pkey` on `(tenant, id)`; `leads_tenant_request_key_key` on `(tenant, request_key)`; `outbox_pkey` on `(tenant, lead_id, kind)`. All indexes reported `is_unique=true`, with the five designated primary-key indexes identified in the inspection. This passes structural uniqueness for non-null key values; verify column NOT NULL/foreign-key/check constraints separately and test application idempotency under retries. The outbox was empty during the earlier aggregate inspection, so no delivery event has been accepted yet.

## Database constraint audit — 2026-10-31 (verified in psql)

Owner queried `pg_constraint` against five tables in `rrs_production` and returned 55 rows, including NOT NULL constraints represented by PostgreSQL constraint type `n`. Observed:

- Each table has a `tenant = 'sew-suite'` check. `leads` has composite primary key `(tenant,id)` and unique `(tenant,request_key)`.
- `lead_receipts` FK `(tenant,lead_id)` → leads, composite primary key `(tenant,request_key)`, and lowercase 64-character hex payload hash check.
- `lead_workflow` FK `(tenant,lead_id)` → leads, primary key `(tenant,lead_id)`, version >= 1, and six allowed statuses (New, Working, Waiting on Customer, Ready to Schedule, Converted, Closed).
- `artwork_intents` FK `(tenant,lead_id)` → leads, primary key `(id)`, unique `(object_key)`, SHA-256 lowercase hex pattern, size 1–10485760 bytes, and states pending/committed/rejected.
- `outbox` FK `(tenant,lead_id)` → leads, primary key `(tenant,lead_id,kind)`, kinds acknowledgment/office, states held/ready/claiming/accepted/delivered/failed/uncertain; relevant required columns are non-null.

**Gate PASSED:** structural schema constraints and current dataset integrity. **Outstanding:** receipt request-key cross-check is application/data validated rather than a database composite FK to leads' request key; real R2 SHA-256 byte verification, mail outbox generation/delivery, runtime workflow and final restore rehearsals still pending. Do not claim the application is cutover-ready based on schema constraints alone.
