# Sew Suite live DNS cutover verification — November 8, 2026

## Current live status
**Public website:** https://www.sewsuite.com  
**New Vercel project:** sewsuite-authentic-comparison, ID prj_I7bHRldBYxY7lezBP8W4g61OGPOx  
**Old Vercel fallback:** sewsuite-website-dlur, ID prj_JRfineZaMpyZk6lccNSV5jb9L3QA; retained with its *.vercel.app hostname.

Owner removed both custom domains from the old project. They were successfully attached to the new project, and Vercel reports both verified.

## Verified DNS
Authoritative nameservers remain GoDaddy ns21.domaincontrol.com and ns22.domaincontrol.com.
- www.sewsuite.com CNAME => b515c08b198a1842.vercel-dns-016.com. Vercel DNS health misconfigured=false.
- sewsuite.com A => 216.150.1.1 and 216.150.16.1. Vercel DNS health misconfigured=false.
- Apex-to-www redirect: HTTP 308 to https://www.sewsuite.com/.
- HTTPS hostname www.sewsuite.com returns HTTP 200 with correct Sew Suite HTML title and public content.

## Verified live endpoints and SEO
- Live homepage, our-work, FAQs all HTTP 200.
- GET /api/public-catalog HTTP 200 with tenant sew-suite, approved catalog version e06f162d-8684-4eef-89fa-57bcec31a4fa, and Sew Suite branding.
- GET readiness for /api/intake, /api/artwork, /api/chat?action=status, /api/chat-lead and /api/voice?action=status returns ready/available. The voice status also reports website_enabled=true.
- /robots.txt HTTP 200: Allow / and sitemap URL on www host.
- /sitemap.xml HTTP 200: **48 URLs**; all 48 independently fetched at live www host and returned HTTP 200, matching page-specific canonical URL and HTML robots meta index, follow.
- Live homepage canonical https://www.sewsuite.com/; production WebP hero served with HTTP 200 and WebP MIME.
- All 11 approved public image sources/28 responsive WebP variants have build coverage, but customer CRM uploads remain unchanged.

## Railway/backend operational status
- Live CRM, independent catalog, mail, voice, artwork gateway, staff backend report online.
- Railway CRM and catalog HTTP requests within the launch window: 0 server-error responses in sampled monitoring.
- Mail worker confirms delivery_enabled=true on 2026-11-08. Previous Nov 1 controlled acknowledgment and office mail tests were accepted, but a **new post-cutover transactional test** is still required.
- 2026-11-08 encrypted backup archive validation, upload and remote decryption PASS.
- Legacy rrs-sew-suite-restore-once one-shot job reports crashed; this must be documented and reconciled separately, but does not prove any currently running customer service outage.

## Pending final acceptance / nonclaims
**Not yet verified:** one actual post-cutover customer quote with approved test image, CRM persistence, office and customer email delivery, artwork retrieval, and chat/voice natural-close capture on the custom domain. GET /api/intake status confirms availability, not successful POST + email. Do not call these production live transactions PASSED without evidence.

Before closing cutover acceptance, submit a marked test inquiry via the live Turnstile form using a safe dummy image (not real customer artwork), then validate staff CRM record, customer acknowledgment, office notification, and attachment download. Separately exercise chat and voice from the final domain, without duplicating leads. Keep old Vercel project and Base44 fallback for rollback.

## Live quote user confirmation — 2026-11-08
- Owner provided a screenshot of the replacement Sew Suite site's **Quote Request Received** success page after a live submission. The React implementation shows this screen only when `/api/intake` responds 202 with `success:true` and a durable `lead_id`; this supports a customer-facing submission acceptance PASS. It is not direct, independent proof of database record contents.
- The screenshot showed **no attached-file success count** and no upload warning; do not claim that artwork was submitted, uploaded, or downloaded on this particular test.
- Connected mailbox search surfaced one customer acknowledgment (subject `Sew Suite: We received your quote request`) and two office lead notifications at approximately 16:41 UTC. The office subjects follow the earlier website form rather than the current independent mail-worker `Sew Suite — New ... quote inquiry` template. Reconcile these separately; do not attach these email notices to the verified new CRM lead without matching transaction evidence.
- The Railway service's HTTP aggregation and listed request logs did not yet include the user's new `/internal/lead` POST or any artwork commit. This may be a metrics ingestion gap or a genuinely missing independent receipt. **No second lead should be submitted solely for diagnostic purposes before checking the CRM.**
- Next acceptance action: authenticated staff CRM latest lead search for the marked test description and timestamp, verify a unique lead, workflow status, original file attachment (if one was included), and notification outbox states. Avoid displaying personal contact details or production attachment contents in acceptance logs.

## Artwork CORS and retry — 2026-11-08
- Owner reported `RRS_SEWSUITE_LIVE_BUCKET_CORS_CONFIGURATION_PASS` and `RRS_SEWSUITE_LIVE_BROWSER_CORS_PREFLIGHT_PASS` from the scoped final-domain CORS script. The exact production origin can now perform a presigned browser PUT preflight. This is configuration evidence, not confirmation that the earlier missing logo was committed.
- Live Railway accepted the new quote via `POST /internal/lead` HTTP **202** and prepared the artwork `POST /internal/artwork/prepare` HTTP **200**. There was no recorded `/internal/artwork/commit` for that attempt; do not mark file verified.
- Pull request #14 merged; new Vercel production deployment `dpl_oEynwgQaZbhdyhpFDxMHrnMmaCLv` READY, source `fbf6d4788ca5b67166e64143bea500845a5766cd`. Live website `www.sewsuite.com` resolves to this deployment and its JS bundle includes a bounded in-session **Retry artwork upload only** action. It preserves the lead, existing committed file receipts, and does not resubmit quote intake. Current already-failed uploads do not auto-recover after page reload.
- A real browser signed PUT and artwork commit (followed by staff CRM download) remain mandatory acceptance.

## Separate mail release blocker — 2026-11-08
- Live Railway intake server currently invokes `rrs_production.accept_lead`, which (in the reviewed 002/012 migration implementations) records two mail notices as `held` and returns `notification_status:'held'`. Mail worker `RRS_MAIL_DELIVERY_ENABLED=true` only claims `ready` notices, so enabling the worker alone does not make freshly submitted quote acknowledgments automatic.
- Historical Base44-template emails observed earlier must not be treated as proof of independent Railway mail delivery. Do not blindly release all held notifications; older test leads may exist.
- Prepared a **candidate** new-lead-only mail release migration and PII-free read-only audit in `kurt66tex-lgtm/rrs-portable-crm` branch `candidate/sew-suite-live-new-lead-mail-20261108`. It is NOT installed. Requires production read-only SQL verification, isolated rollback test, fresh offsite backup and controlled operator execution.

## 2026-11-08 live DB read-only confirmation (owner psql)
- Connected to Railway project `rrs-sew-suite-production`, environment `production`, database `railway` via `railway connect Postgres`.
- Owner query returned **exactly one** new test website form lead on 2026-11-08 at **11:16:25 America/Chicago**, lead UUID prefix `ca97fb22`, description contains `Railway Cutover Verification 2`.
- Outbox for that lead: acknowledgment **held**, office **held**. Artwork: **one pending** intent, **zero committed**. This independently confirms new-site quote persisted and separates it from the earlier Base44 email.
- Do not resubmit quote. Do not state the original artwork was saved. Request a read-only exact-row queue/intent audit before any narrowly scoped email release or file reattachment; older held notifications must remain unchanged. The existing bucket CORS final www-origin preflight PASS and in-session retry release apply only to new browser attempts, not a recovery of this expired intent.

## November 8 live exactly-two-notice release and Graph acceptance
- Operator read-only SQL confirmed exact lead `ca97fb22-93ee-4344-9a62-9631a888c336` (Railway Cutover Verification 2) had one pending 94,201-byte artwork intent, zero committed; both `acknowledgment` and `office` notices were `held`, `attempt_count=0`.
- Owner executed a guarded **exact lead ID** SQL transaction, verifying correct website-form identity, email and test description, two held/unsent notices and absence of claim tokens. Output `RRS_SEWSUITE_EXACT_TWO_MAIL_RELEASE_PASS`, `COMMIT`. Only these two were set to `ready`; historical held notices were not changed by the transaction.
- Railway mail worker `sew-suite-mail-worker` reports on Nov 8 at **19:26:20 UTC** `RRS_MAIL_ATTEMPT_RECORDED { kind: 'acknowledgment', state: 'accepted' }` and **19:27:20 UTC** `RRS_MAIL_ATTEMPT_RECORDED { kind: 'office', state: 'accepted' }`. Graph 202 is send-provider acceptance, not in itself guaranteed inbox delivery.
- Connected Outlook search returned correctly templated `Sew Suite — We received your quote request` for the marked test at 19:26:19 UTC and `Sew Suite — New Website Form quote inquiry` at approximately 19:27:19–21 UTC. Multiple Outlook search hits for the office subject were observed but only **one worker office acceptance log**; do not infer a duplicate send without further mailbox-folder reconciliation.
- A standalone future-lead auto-release candidate exists in `rrs-portable-crm` branch `candidate/sew-suite-live-new-lead-mail-20261108`; remains uninstalled pending isolated rollback test and explicit production release. Do NOT generalize the one-off manual release into automatic processing or claim that future leads will get mail yet.
- Existing upload intent remains **pending** until an authorized attachment-only retry/recovery finishes; do not ask for a duplicate quote. The in-page retry button only works with an active capability retained in the same page session.

## Existing-lead private artwork recovery source failure — 2026-11-08
- Read-only lead-specific SQL confirmed one 94,201-byte PNG pending on lead `ca97fb22-93ee-4344-9a62-9631a888c336`, and two different `committed` artwork metadata matches sharing its SHA256 and byte count. Metadata similarity does NOT verify that private S3 objects still exist.
- Owner executed the cautious PowerShell recovery script with the production artwork-gateway environment. AWS S3 `GetObject` for the **hardcoded** synthetic source `private/sew-suite/563d6386-88d6-479e-90cf-58f71c5ab518/8e35eb5a-52b0-4392-88c5-a705c5d0d0aa/sewsuite-qa.PNG` returned `NoSuchKey`; script emitted `BLOCKED_SOURCE_OBJECT_READ_FAILED`. No target copy, SQL preparation or commit should be inferred.
- Next: identify both candidate `object_key` values from the read-only `artwork_intents` table, probe each object via HEAD and verify the actual bytes/hash before selecting a source. Do not rerun the same hardcoded script or modify any metadata in response to the missing object. If neither S3 source exists, use the owner's original local PNG with exact SHA validation in a guarded existing-lead-only copy flow.

## 2026-11-08 artwork verified-source recovery package (pending operator execution)
- The owner checked both actual S3 object keys against exact pending lead artwork digest; BOTH independently returned `RRS_SEWSUITE_MATCHING_ARTWORK_SOURCE_VERIFIED_PASS` (IDs `d0b6b99a-126c-4777-8e44-a24209842f21`, `b896728a-4fc0-4917-a285-a8e3b541cf50`), verified source count 2, with no storage/database changes. The original older hardcoded source was missing (`NoSuchKey`), not evidence of lost live customer uploads.
- Prepared one-shot operator package `SewSuite_Artwork_Existing_Lead_Restore.zip`. It verifies source PNG bytes (94,201), exact SHA-256 `fbc71b09315e6c29ce843bc1c2e34b6da4da5fef2a576c4d8d53d96af567acac`; calls existing Railway `/internal/artwork/prepare` with the *exact approved live lead ID*; PUTs to the short-lived signed URL; independently GETs target from private S3 and checks checksum; then calls existing `/internal/artwork/commit`. It never calls public intake, never alters historical source files, never sends email or updates SQL directly. It refuses repeated local runs through an attempt marker. User execution and authenticated staff CRM download remain pending. Do NOT claim recovery completed merely because package exists.
- The older pending metadata remains untouched and visible only in audit. On success a new committed artwork intent/file should be visible to staff; verify authorized download and size/hash before marking full workflow PASS.

## 2026-11-08 v1 recovery wrapper defect and v2 correction
- Owner ran the guarded existing-lead recovery under Railway production artwork gateway; it emitted `RRS_SEWSUITE_RECOVERY_BLOCKED BLOCKED_NO_VERIFIED_SOURCE_OBJECT` before any source SHA256 PASS, gateway prepare, S3 PUT or commit. The script writes its local attempt marker **after** source verification, so this failure precedes the marker and target writes; verify actual absence of the marker before considering a retry.
- Review of the shipped PowerShell v1 script found `function Invoke-ScopedAws([string[]]$Args)` and `& aws @Args`, using the PowerShell special automatic `$args` variable name. The earlier successful source-check script used a distinct named parameter `$cliArgs`. This difference is a **likely** wrapper bug, not evidence that the verified S3 source files disappeared.
- Prepared corrected **v2** package `SewSuite_Artwork_Existing_Lead_Restore_v2.zip` with explicit `[string[]]$CliArgs`, `Invoke-ScopedAws -CliArgs @(...)`, sanitized per-source read errors and both old/new local attempt-marker guards. It remains **UNEXECUTED**; only the owner-side output can verify the repair.
- Do not submit another quote, delete source objects, or bypass a marker. After any successful v2 commit, independently confirm the new artwork is visible and downloadable in the existing staff CRM lead and the bytes match SHA256.

## 2026-11-08 existing-lead artwork recovery — PASS (staff download pending)
- Owner executed guarded `SewSuite_Restore_Artwork_Existing_Lead_v2.ps1` in the production Railway artwork-gateway environment and reported these sequential PASS markers: `RRS_SEWSUITE_RECOVERY_SOURCE_SHA256_PASS` for verified source `d0b6b99a-126c-4777-8e44-a24209842f21`; `RRS_SEWSUITE_RECOVERY_GATEWAY_PREPARE_PASS`; `RRS_SEWSUITE_RECOVERY_SIGNED_UPLOAD_PASS`; `RRS_SEWSUITE_RECOVERY_STORAGE_READBACK_PASS`; `RRS_SEWSUITE_RECOVERY_GATEWAY_COMMIT_PASS`; `RRS_SEWSUITE_RECOVERY_COMPLETE_EXISTING_LEAD_NO_QUOTE_RESUBMIT`.
- **New committed attachment ID:** `8e56eda2-6595-4b24-b29f-637b326f9de3`. **Existing quote/lead:** `ca97fb22-93ee-4344-9a62-9631a888c336`. Expected image: `sewsuite-qa (1).PNG`, 94,201 bytes; SHA-256 `fbc71b09315e6c29ce843bc1c2e34b6da4da5fef2a576c4d8d53d96af567acac`.
- Independent Railway HTTP stream confirms `POST /internal/artwork/prepare` HTTP **200** at **21:44:02Z** and `POST /internal/artwork/commit` HTTP **200** at **21:44:08Z** on November 8; artwork gateway reports online without active warning.
- Recovery created a separate committed attachment; the failed original pending intent was not mutated or deleted. No public quote was resubmitted, no customer email sent, and original source files preserved.
- **Still pending acceptance:** authenticated staff CRM must show the committed attachment on this lead, download original PNG, and verify bytes/size, plus deny unauthenticated download. Mark user-facing CRM readback PASS only when observed. General automatic new-quote mail readiness remains a separate release blocker; one specific test lead's manually released notices were verified earlier.

## 2026-11-08 authenticated staff download — PASS

- Owner opened the exact live `Railway Cutover Verification 2` quote in the independent Sew Suite staff CRM, confirmed the recovered PNG is present, and successfully downloaded it; no duplicate quote was created.
- Independent Railway `sew-suite-staff-crm-backend` HTTP logs show authenticated `GET /staff/frontend/api/workspace/leads/ca97fb22-93ee-4344-9a62-9631a888c336/attachments/8e56eda2-6595-4b24-b29f-637b326f9de3/download` at **2026-11-08 21:49:21.995560188 UTC**, **HTTP 200**. The staff lead detail had HTTP 200 at 21:49:16–17 UTC.
- Together with the owner-observed S3 source checksum, signed PUT, target readback, gateway prepare and commit HTTP 200, **existing-lead private artwork recovery and authenticated CRM access are PASS**. Do not claim a new customer-browser upload after CORS correction has been separately tested, nor that cross-account/unauthenticated download denial was retested on this specific file.
- The daily production backup has 2026-11-08 08:01 UTC archive validation, remote upload and remote decrypt PASS, **before** the 21:44 UTC recovered artwork. Next scheduled backup should be checked for post-recovery coverage. The legacy one-shot `rrs-sew-suite-restore-once` is still a stale crashed job; active production core services are online.
- Remaining release gating: new quote automatic mail readiness (current `accept_lead` function creates `held` notices; manual exactly-two release for this lead was successful), final-domain browser artwork PUT regression, chat and voice lead auto-capture/close workflow, full reusable factory procedure end-to-end.

## 2026-11-08 next-stage automatic quote email: isolated CI PASS; no production change

- Built a **draft**, unmerged PR in independent backend repo `kurt66tex-lgtm/rrs-portable-crm`: [#14](https://github.com/kurt66tex-lgtm/rrs-portable-crm/pull/14), branch `candidate/sew-suite-live-new-lead-mail-20261108`. It contains a candidate SQL function migration to create `ready` notifications for **new** approved leads while keeping preexisting `held` rows unchanged, a no-PII audit, and PostgreSQL 16 isolated rollback tests.
- The GitHub Actions `Sew Suite future lead mail-ready candidate isolated Postgres` run `42527849822` finished **success** on commit `25f15f6622f9e95c064daf0ea18d20a0fbd8832c`. Checks include 012 replay-guard baseline, candidate installation in disposable DB, exactly two ready notices for new lead, replay idempotence and unchanged historical-held count, and rollback of the candidate synthetic test lead. No production SQL or new customer mail was sent.
- Production `rrs_production.accept_lead` is still returning `notification_status:'held'`; do not mark **automatic future-lead mail** PASS yet. Before applying candidate, verify current stored function and exact queue counts read-only, get current post-artwork encrypted offsite backup, and operator-controlled scoped SQL change with a post-release live transactional acceptance test.
- Do not merge the draft PR or install SQL solely on isolated CI success.

## November 8 live UTF-8 repair, public admin redirect and post-artwork backup

- Owner reported live portfolio images/descriptions and other public data displaying raw legacy text such as `Sew Suiteâ€™s`; live `/api/public-catalog` read-only inspection found **18** known malformed strings in service tips, business region label, portfolio project title/description/SEO metadata and intake options. Correct spelling is `Sew Suite’s`. Static prelaunch SEO JSON was already clean.
- Source `src/api/base44Client.js` had only a partial inline encoding normalizer (handled `Ã©` and dashes but not `â€™`). Deployed shared deep, display-only `src/lib/repairDisplayText.js` for affected historical Windows-1252 mojibake sequences, all catalog-derived public settings, image descriptions, metadata, captions and input options. Does not mutate source catalog database, private artwork, or customer data. Regression tests cover nested strings and idempotence.
- Owner also reported the live `www.sewsuite.com/admin` showed the old Base44 Google/password screen and `loginViaEmailPassword is not a function`. This is the obsolete public UI, not the separate Microsoft staff CRM. Added Vercel 307 server redirects for public `/admin`, nested `/admin/*` and legacy `/login`, `/register`, `/forgot-password`, `/reset-password` to the independently hosted `sewsuite-production-crm.vercel.app`; replaced client-side legacy Login component with a Microsoft staff-login redirect fallback. Never restore the unsupported Base44 auth endpoint or grant an account a role just to fix a redirect.
- Fix PR #15 merged to website production branch, commit `4cc954b93742d51061e5928e45f7369521138855`. Vercel production `dpl_A6Y3SSTXKMmJgKcaEZ4K2URVu74H` READY; www domain points to it. Live `/admin`, `/admin/agency`, `/login` each HTTP 307 to the CRM; live `/our-work` HTTP 200; 48 static SEO routes PASS with production indexability intact. User-side visual signoff on the corrected descriptions and agency Microsoft login still pending. The approved agency role is bound to a pre-provisioned Microsoft directory guest **object**, not a typed contact email; do not publish user directory identifiers in public documentation.
- Owner's off-schedule Railway backup job completed successfully **2026-11-08 22:09:45 UTC**, AFTER the recovered artwork was committed and downloaded. Actual logs include `RRS_PROD_BACKUP_ARCHIVE_VALIDATED`, `RRS_PROD_BACKUP_REMOTE_UPLOAD_DONE`, `RRS_PROD_BACKUP_REMOTE_DECRYPTION_PASS` at 22:09:44 UTC; backup cron reports `cronSucceeded`, warnings=0. This is a verified post-artwork offsite archive, though a full restore rehearsal is a separate gate.
- The backend new-only automatic-mail candidate remains in **draft** `rrs-portable-crm` PR #14. Its isolated PostgreSQL CI run `42527849822` succeeded; the mail worker itself is online. No live function migration has been run. Existing exact-lead manual two-mail acceptance is already verified; automatic future lead notifications remain a blocker.
