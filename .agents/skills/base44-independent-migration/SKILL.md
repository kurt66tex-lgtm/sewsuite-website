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

## Mandatory public-website image SEO and performance gate

Applies to every Service Trade Agency website factory build, clone, refresh, and Base44 → Railway/Vercel migration. **Never** run public optimization on CRM or customer uploads: preserve original artwork, photographs, proofs, printable files and R2 objects byte-for-byte, including filenames and format. Public *published and permission-approved* portfolio photos are distinct from private CRM source files.

1. Inventory public hero, service, about, portfolio, gallery, trust badge, logo, review QR, and social images. Require an approved local public asset/permission record for publication; no Base44-hosted runtime images and no private customer storage paths. Do not silently rewrite external uploads.
2. For raster photographs generate WebP variants without upscaling (target 480/800/1200/1600px plus intrinsic width). Keep originals as fallback/rollback. AVIF is optional only if the encoded image is measurably smaller at equivalent quality. For photographic detail preserve readable embroidery/print features. For logos and QR prefer lossless WebP or SVG/PNG where the original is sharper/smaller; retain scannability of review QR.
3. Provide responsive `srcSet` + `sizes`, explicit natural dimensions/aspect ratio, descriptive factual `alt` (or `alt=""` when decorative), relevant titles/captions, descriptive filenames and page-local text. Do not keyword-stuff with city/service phrases.
4. Never lazy-load above-fold/LCP hero images. Set high priority and eager load; use appropriate WebP responsive sources and preload only the chosen hero. Below-fold portfolio cards/photos load lazily. Preserve exact approved crop, layout, typography, buttons, colors and logos.
5. Ensure image discovery in crawlable prerendered HTML, page-specific Open Graph/Twitter images, and useful ImageObject/CreativeWork structured data where appropriate. **Use one primary hostname consistently across the sitemap, static HTML canonical tags, hydrated React canonical/og:url tags, LocalBusiness/Breadcrumb schemas, robots sitemap reference, and apex redirect.** Never let legacy source `website_url` override the approved launch hostname. Preserve indexing and public/privacy boundaries.
6. Run `npm run build` (automatically runs `npm run optimize:public-images` and `npm run test:public-images`) and verify successful image manifest, no missing assets, WebP signatures, original-size variant, page-specific alt metadata, 200 URLs, preview noindex, and source-vs-preview mobile/desktop visual parity. Track measured original/variant bytes, load/LCP and layout-shift results rather than claiming unmeasured gains.
7. Stop at preview signoff until owner authorizes production deployment and DNS; keep Base44 available for rollback. The dedicated Sew Suite image preview may serve an approved **public-only** snapshot for visual comparison. That is not a substitute for the independently versioned Railway catalog acceptance gate prior to cutover.

Sew Suite reference implementation: `scripts/optimize-public-images.mjs`, `src/components/site/PublicOptimizedImage.jsx`, `scripts/build-static-seo.mjs`, `scripts/test-public-image-performance.mjs`, and `docs/website-factory-public-image-seo-migration-skill.md`. Use this pattern on future projects but regenerate each site's approved public assets, alt text, crop and local business context; never copy Sew Suite-specific copy or assets.

## Private artwork browser-CORS release gate

The public website's WebP optimization is **not** the same as private customer CRM artwork; never modify original customer uploads. When private artwork is uploaded using an S3-compatible presigned browser PUT URL, the *bucket* must allow the **final production hostname** (not only the previous preview hostname) in its CORS `AllowedOrigins` with method `PUT` and header `content-type`. Preserve old CORS rules while adding the narrow new production origin; no wildcard origin.

Acceptance requires: (1) an authenticated durable lead submission HTTP 202; (2) private-artwork prepare HTTP 200; (3) anonymous browser-style S3 OPTIONS preflight with `Origin: https://www.sewsuite.com`, `Access-Control-Request-Method: PUT`, `Access-Control-Request-Headers: content-type` returning the expected allow-origin/method headers; (4) actual browser signed PUT success; (5) private artwork commit HTTP 200; (6) CRM authenticated staff attachment download and unauthorized denial. A **prepare 200 without commit** must be marked UPLOAD FAILED and investigated before final migration signoff, without resubmitting or duplicating the accepted lead.

Sew Suite 2026-11-08 incident: website posted a new lead (Railway POST /internal/lead HTTP 202 at 17:16:25Z) and artwork prepare POST HTTP 200 at 17:16:25Z, but artwork commit was absent. Prior Oct 30 narrow CORS allowlist was configured for the Vercel preview origin; the production `www.sewsuite.com` Origin was not documented as permitted. The owner subsequently verified the production browser CORS preflight and corrected the exact-origin bucket rule. The original attachment nevertheless remained uncommitted; this was recovered separately without resubmitting the quote. Do not infer successful file storage from an availability or CORS preflight alone.

## Live artwork CORS and retry acceptance (November 8, 2026)

On the *final production domain*, verify presigned private-artwork browser PUT CORS with an exact origin (`https://www.sewsuite.com`), method PUT and header `content-type`; do not overwrite other allowed origins or allow arbitrary origins. CORS preflight PASS alone is a **configuration** result, not evidence that an already failed file was committed.

Sew Suite owner ran the scoped CORS update and confirmed `RRS_SEWSUITE_LIVE_BUCKET_CORS_CONFIGURATION_PASS` and `RRS_SEWSUITE_LIVE_BROWSER_CORS_PREFLIGHT_PASS`. The prior production quote had already returned HTTP 202 and private artwork prepare returned HTTP 200, but no private-artwork commit was observed. Leave the existing quote and customer file unchanged; do not create another quote as a workaround.

For service-business factory builds: when an attachment fails after a confirmed lead receipt, keep the saved lead ID, original selected File object and scoped upload capability only **in memory** while the confirmation page stays open. Offer an explicitly labeled **Retry artwork upload only** action that generates a fresh presigned URL for only unconfirmed files, caps attempts, preserves previously committed file receipts and NEVER posts `/api/intake` again. On a refresh/browser close the in-memory capability expires: offer staff-assisted upload to the existing lead rather than asking for a new quote. Mark the artwork gate PASS only after PUT + commit 200 and staff CRM readback (and unauthorized denial).

## Existing-lead private-artwork salvage (Sew Suite 2026-11-08)

When a submitted quote has one `pending` artwork intent and no committed attachment, first verify the lead's exact UUID and matching file size/checksum in a **read-only** SQL audit. Matching `artwork_intents` metadata is only a candidate source, **not proof that the object exists**: source objects may have been cleaned up after a previous synthetic test. Read candidate `object_key` paths directly from the current database; never reuse a historical hardcoded S3 key. HEAD and GET each candidate S3 object with restricted credentials, check actual size, SHA-256 and MIME magic before copying.

For an authorized existing-lead recovery, use a fresh scoped `/internal/artwork/prepare`, private presigned PUT, target object readback and checksum verification, then `/internal/artwork/commit`. Never change an unrelated attachment's `lead_id` or `object_key`, and never mark a pending object as committed without gateway integrity checks. Preserve original objects. Use an attempt marker/idempotency barrier and stop on a partial failure so no duplicate committed attachments are created.

**PowerShell caution:** never name a named function parameter `$Args` because `$args` is an automatic variable (case insensitive); choose `$CliArgs` or `$Arguments` explicitly. In the Nov 8 Sew Suite case, this error caused a false `BLOCKED_NO_VERIFIED_SOURCE_OBJECT` before target writes. Corrected v2 script passed source SHA256, prepare, signed PUT, S3 readback and commit. Actual production Railway HTTP logs independently showed prepare 200 and commit 200 at ~21:44 UTC, with committed attachment `8e56eda2-6595-4b24-b29f-637b326f9de3` on existing lead `ca97fb22-93ee-4344-9a62-9631a888c336`. Staff CRM authenticated download subsequently PASSED for the same lead and attachment, verified by owner opening the expected PNG and Railway staff backend HTTP 200 at 2026-11-08 21:49:21 UTC. Cross-user and unauthenticated access-denial checks on this specific newly recovered attachment remain separate acceptance gates.

## Final-domain encoding and independent-admin cutover gate

Before turning on indexing for a migrated service website, inspect **live source catalog API payloads**, React-hydrated page text and static SEO snapshots for legacy double-decoding strings such as `â€™`, `â€”`, `â€“`, `Ã©`, `Â®`. Validate image captions and metadata, not just homepage text. Prefer repairing the underlying approved catalog at a controlled data-migration checkpoint; when source mutation is unsafe during cutover, use a **deep, display-only, idempotent normalizer** over the independent read adapter to correct page text and metadata while leaving customer/CRM data unchanged. Include representative field-level regression tests; don't silently rewrite legitimate Unicode.

The migrated **public website must not retain an obsolete Base44 login** when its SDK has intentionally been removed. Redirect `/admin`, `/admin/*`, `/login` and unsupported legacy registration/password-recovery routes to the independent CRM using server-side temporary redirects, with a client-side redirect fallback for cached SPA navigation. Verify that no public password form calls nonexistent Base44 SDK methods and that both signed-out and authorized sessions reach the correct protected portal.

Microsoft Entra staff and agency roles must bind to pre-provisioned **directory object IDs**, not just similarly named email addresses; a guest directory username can differ from the contact email. Preserve account identity and role assignments, use account-picker login where appropriate, and never auto-grant agency access to a new/unknown Microsoft identity. Test both staff and agency sign-in separately, then verify role-specific pages and permissions. A working HTTP 307 redirect alone is not proof of a successful Microsoft sign-in.

Sew Suite Nov 8 example: current public catalog had 18 historical mojibake strings; display normalizer and server auth redirects shipped via website PR #15, production deployment `dpl_A6Y3SSTXKMmJgKcaEZ4K2URVu74H`. Independent portfolio remained HTTP 200, static SEO had 48 indexable routes. Owner sign-in role/visual signoff remain separate checks.

## Checkpoint notation

Use PASS only for evidence observed in the current target environment. Mark a check PENDING when code exists but the real workflow has not been exercised. Record failing tests and the verified fix, not just the error.

## Windows operator instructions

When the operator sees `railway=#`, they are inside psql. Provide psql-only instructions. To execute PowerShell, first have them enter `\q`; to resume SQL, reconnect to the intended Railway PostgreSQL service. Use verified full file paths when invoking SQL scripts.

## Sew Suite caveat

The approved website deployment is `sewsuite-authentic-comparison`, not `sewsuite-independent-prelaunch`. Do not move `sewsuite.com` or `www.sewsuite.com` without the owner's explicit final approval.
