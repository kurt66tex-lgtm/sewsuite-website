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

## Artwork size mismatch — metadata reconciliation checkpoint

Owner inspected the single committed `rrs_production.artwork_intents` record: ID `5149af45-656e-49e0-9d2e-fe060ac81607`, stored size `1425452` bytes, state `committed`, non-null commit timestamp, SHA-256 `ed5f8d68bb363756d7d2d11b4f7bdeacd086dfc1ef3673509a4e49ae91eca105`. The earlier approved synthetic PNG was **94201** bytes, so these sizes differ by 1,331,251 bytes; do not call them the same file. A Railway staff HTTP 200 for this exact attachment was logged on 2026-10-29; actual file bytes/hash were not independently checked here. Keep this as a separately identified earlier artifact and check metadata-to-object consistency with a controlled authenticated download; no delete, update, or fabricated matching assertion.

## Artwork investigation closure and lead linkage — 2026-10-31

Owner confirmed that the previously discussed artwork download-size discrepancy had already been investigated extensively and resolved as a right-click **Save As** download workflow issue. **Do not reopen the same discrepancy without new contradictory evidence.** Current database metadata: one committed PNG artwork record, ID `5149af45-656e-49e0-9d2e-fe060ac81607`, size `1425452` bytes, created `2026-10-29 14:07:10.060976+00`, committed `2026-10-29 14:07:10.068997+00`, linked to a lead created `2026-10-12 15:07:26.346+00`, workflow status `New`, SHA-256 `ed5f8d68bb363756d7d2d11b4f7bdeacd086dfc1ef3673509a4e49ae91eca105`. The prior comparison with an unrelated 94,201-byte synthetic asset must not be treated as evidence of corruption. Existing DB integrity, unique indexes, FK/CHECK constraints and staff download evidence remain PASS. Move to outbox/notification workflow, avoiding live mail sends until separately approved.

## Outbox function discovery — October 31, 2026

Owner ran a read-only `pg_trigger` and `pg_proc` discovery query for user-defined triggers on `rrs_production.leads`/`outbox` and notification-related stored functions. No user-defined trigger was returned for those two tables. Two stored functions were found under `rrs_production`: `claim_email()` and `complete_email_claim(p_lead uuid, p_kind text, p_claim uuid, p_state text)`. This establishes names/signatures only, not execution semantics. Production outbox previously had zero rows. Next inspect `pg_get_functiondef` read-only for both functions, database function privileges and backend mail-worker implementation before running controlled test enqueue; do not call claim/complete functions or enable outbound email during inspection.

## Mail claim SQL review and remote acceptance audit — 2026-10-31

User supplied stored-function bodies: `rrs_production.claim_email()` is SECURITY DEFINER, checks current database, uses `FOR UPDATE OF o SKIP LOCKED` to claim the oldest `ready` outbox record joined to a lead, sets state `claiming`, claim token, attempt_count+1, and returns lead data; `complete_email_claim(p_lead,p_kind,p_claim,p_state)` accepts only acknowledgment/office and accepted/failed/uncertain outcomes, updates only the matching claiming row/token, and raises `mail_claim_conflict` unless exactly one row updated. This confirms **claim atomicity and completion token matching**, not delivery or robust recovery. No timeout reclamation or retry-after-failure appears in either function; search for separate recovery mechanisms and operational alerting. Provider `accepted` must not be interpreted as mailbox delivered.

Read-only connected Railway inspection: production CRM startup logs most recently reported `enabled:false`; staff service reported `write_workflows:false`; voice gateway `enabled=false`; backup worker continued to report validated encrypted remote uploads and decryption. Mail worker has named Graph and delivery flag variables, but OAuth reads names only (not values). Protected Vercel preview GET /api/intake and GET /api/chat-lead both returned HTTP 200 with `{\"available\":false}`, consistent with intended blocked intake, not production-flow acceptance. No mail was sent, no production records modified, and no domain changes made.

Autonomous tool capability: use Railway/Vercel/GitHub connected read-only actions for deployment, logs, configuration names, source inspection and preview probes; these tools do not provide a direct arbitrary PostgreSQL query execution interface. Ask the operator for a single grouped SQL verification only where the database outcome is indispensable; do not repeatedly request trivial statements already evidenced. Remaining release gates: test outbox enqueue and controlled Microsoft Graph delivery without real customer recipients, verify retry/recovery handling, controlled chat/voice finalize, final-schema restore, runtime website parity and explicit domain-cutover authorization.

## Independent verification of previously completed restore and artwork, 2026-10-31

Connected Railway deployment logs establish an actual isolated database restore on October 29, not only remote archive decryption: `RRS_RESTORE_ISOLATION_CHECK_PASS`, `RRS_RESTORE_DECRYPTED_ARCHIVE_PASS`, `RRS_RESTORE_PG_RESTORE_PASS`, `RRS_RESTORE_ROW_COUNTS_PASS {"tables":13,"rows":19,"nonempty_tables":7}`, and `RRS_RESTORE_ACCEPTANCE_PASS`. Subsequent application changes still require a fresh backup/restore assessment at final release.

The private artwork audit independently streamed the stored PNG and computed exact object size 1425452 and SHA-256 `ed5f8d68bb363756d7d2d11b4f7bdeacd086dfc1ef3673509a4e49ae91eca105`, matching the committed artwork database row. Railway logs reported `RRS_ARTWORK_APPROVED_PRIVATE_STORAGE_PASS`, and a separate CRM-link audit reported `RRS_APPROVED_ARTWORK_CRM_LINK_PASS`. Earlier checks compared an unrelated file; do not reopen that resolved issue.

## Email-worker recovery and go-live risk, source inspected October 31

Actual production/mail-worker.mjs on backend release branch `sew-suite-isolated-restore-20261029` has a 60-second poll gated on `RRS_MAIL_DELIVERY_ENABLED` and verified Microsoft Graph credentials/alias. It calls `rrs_production.claim_email()`, composes an acknowledgment or office notice, obtains a Graph application token, POSTs to Graph sendMail and completes claim as accepted, failed or uncertain. It correctly comments that HTTP 202 is accepted, not proven delivered. The PostgreSQL claim function uses `FOR UPDATE SKIP LOCKED`, marks ready→claiming and increments attempts; completion requires matching claim_token and claiming state. Neither inspected SQL function nor the inspected worker implements a stale claiming-row recovery procedure or an approved manual reconciliation path for uncertain/failed sends. A send may have been accepted before a crash; blindly resetting claiming or uncertain to ready can duplicate mail. **Block production delivery** until an auditable operator reconciliation/requeue process and sent-mail/provider evidence policy are tested, with restricted permissions and an explicit retry decision. Do not automatically resend uncertain or stale claims.

Current approved Vercel preview reports GET /api/intake and GET /api/chat-lead as available:false, and Railway service startup shows public CRM intake disabled, staff write workflows disabled and production voice disabled. These are deliberate safeguards, not functional go-live passes.

The separate backend release manifest check production/check-cutover-gates.mjs groups database recovery, website/SEO, intake/chat, staff CRM, voice, artwork and email. The source manifest has outstanding gates for live intake/chat/voice, production mail delivery, staff write workflows, some SEO/analytics and source access-history import. Treat its fail-closed result as authoritative for cutover until verified gate evidence updates it. No DNS or customer-delivery change authorized.

## Release manifest audit and independent catalog configuration — 2026-10-31

Read-only inspection of the authoritative private backend release checker and Sew Suite manifest found 38 required gates: 24 marked true and 14 pending. Groups: Database & recovery 4/4; Website / SEO 3/9; Intake & chat 2/4; Staff CRM 7/10; Voice 1/3; Artwork 4/4; Email 3/4. These are the persisted manifest values; verify field-level evidence before changing flags.

Website remaining: production_website_snapshot_adapter_replaced, production_catalog_runtime_delivered, portfolio_live_to_preview_parity_verified, production_live_indexable_metadata_verified, analytics_seo_parity_verified, production_site_domain_origin_validated.
Intake remaining: public_website_intake_verified, public_chat_intake_verified. Staff remaining: production_staff_workflow_live_accepted, production_staff_portal_db_workflow_verified, source_access_history_migrated_verified. Voice remaining: production_voice_provider_session_test_verified, production_voice_crm_handoff_verified. Email remaining: production_mail_delivery_verified.

Connected Vercel preview configuration for approved sewsuite-authentic-comparison project: VITE_PUBLIC_CATALOG_MODE=independent, RRS_PUBLIC_CATALOG_MODE=independent, RRS_PUBLIC_CATALOG_ENABLED=true, and matching VITE_APPROVED_CATALOG_VERSION/RRS_APPROVED_PUBLIC_CATALOG_VERSION=e06f162d-8684-4eef-89fa-57bcec31a4fa. This is positive **configuration** evidence, not proof of live independent catalog API response or production-host indexing. Do not mark production_catalog_runtime_delivered solely from variables. Preview remains noindex.

Live canonical Base44 app read-only recheck: six AccessAudit events (one invite created, four resent, one accepted), plus one original non-test LeadAttachment size 1,425,452 bytes. Independent private artwork storage byte/hash and linkage passes; source audit-event destination import remains pending.

Backend branch pull request #3 contains candidate replay-notice guard, read-only stale-claim reconciliation SQL and no-production-access CI. GitHub Actions workflow run 41215452871 concluded success. Code not merged into deployed branch and SQL not executed. Outbound customer mail remains disabled.
## Isolated PostgreSQL notification replay regression PASS (2026-10-31)

Private backend PR #3 branch sew-suite-mail-replay-safety-20261031 includes candidate migration 012, read-only mail audit 013 and GitHub Actions with disposable PostgreSQL 16. Workflow run 41215799757 completed SUCCESS; verified original schema + mail functions + candidate migration and synthetic tests: new two-held-notice lead, correct idempotent replay, one accepted/one held outcome, missing outbox fail-closed without auto-backfill, mismatched request-hash rejection. Log marker RRS_MAIL_REPLAY_ISOLATED_POSTGRES_ACCEPTANCE_PASS. **Candidate migration not merged or applied to Railway production.** Controlled Microsoft Graph delivery, lost-claim handling, staff/voice acceptance and remaining website/SEO gates are still open.
## October 31 connected Outlook and public catalog verification

The Outlook connector confirmed the Sew Suite mailbox account and historical October 18 synthetic test sends plus an October 20 mail test in Sent Items. Current Railway mail-worker delivery remains unverified and disabled.

The approved protected Vercel comparison site's public catalog endpoint returned HTTP 200 and the approved version. Service areas, services, portfolio projects and intake question counts were 20, 9, 8, 5, respectively, exactly matching fresh read-only Base44 counts. The preview sitemap returned 49 unique canonical URL entries and no duplicates. Preview service area, work and why-us routes returned 200 with noindex. These checks establish independent preview count and route reachability, not production indexing, full visual parity, or live customer acceptance.

## October 31 full preview route sweep and stable alias correction

Audited all 49 paths in the then-current protected preview sitemap. Each returned HTTP 200 and noindex; 48 had path-matching canonical URLs, but stale portfolio URL /our-work/allen-americans-embroidered-polo served homepage canonical and title. Original Base44 and independent approved catalog both contain eight portfolio projects. Corrective website PR #4 removed the unapproved ninth portfolio URL and tightened scripts/test-sitemap-parity.mjs to demand exact 48-path matching, not just presence of required URLs. PR #4 merged to deployed branch at commit 1e0ce47bc4c8c2b6a0b6a8f1bb9836d50bf779bf. The new Vercel preview deployment dpl_GS6f57zpRgSrVoyTdda6zgbEvuoS returned the corrected 48 unique sitemap URLs, with preview noindex preserved. The stable protected comparison alias sewsuite-authentic-comparison.vercel.app was previously pinned to old deployment dpl_AixCxUiGRd8RHs2Zxsfvg3nJv8gL; it was re-assigned to dpl_GS6f57zpRgSrVoyTdda6zgbEvuoS and read back as the new mapping. Stable alias recheck: sitemap HTTP 200, 48 URLs, stale entry absent, X-Robots-Tag noindex,nofollow, GET /api/intake available:false. This was a **preview-only alias** update, not a change to sewsuite.com/www, DNS, email, or public intake. The corrected route sweep is a preview SEO routing PASS; final production indexability and end-user visual/interaction parity remain pending.

## October 31 public-domain preservation verified

Vercel project domains read-only verification: approved comparison project sewsuite-authentic-comparison lists only sewsuite-authentic-comparison.vercel.app, verified. Existing Vercel project sewsuite-website-dlur still owns verified sewsuite.com and www.sewsuite.com domains, plus its default Vercel hostname. The protected preview alias correction did not reassign the public domain. Preserve this exact old-project assignment and rollback reference until explicit owner-authorized cutover.
