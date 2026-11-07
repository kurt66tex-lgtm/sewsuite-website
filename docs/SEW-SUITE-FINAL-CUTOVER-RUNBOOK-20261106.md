# Sew Suite — Final Domain Cutover Runbook and Verified Gates (2026-11-06)

## Exact domain and project targets
- Authoritative destination domain: **www.sewsuite.com**, not `www.sewstuite.com` (typo).
- Current domain owner/project: Vercel `sewsuite-website-dlur`, project ID `prj_JRfineZaMpyZk6lccNSV5jb9L3QA`.
- New independent website: `sewsuite-authentic-comparison`, project ID `prj_I7bHRldBYxY7lezBP8W4g61OGPOx`.
- Same Vercel team `team_730q4ui693sPShhGUXqgE75C`.
- Both `www.sewsuite.com` and `sewsuite.com` currently belong to old project; apex redirects to `www.sewsuite.com`.
- Do NOT perform a domain transfer or DNS change before the owner gives explicit final authorization. Leave original Base44 app and old Vercel project untouched for rollback.

## Verified technical readiness and scope
- Release source branch: `sew-suite-catalog-version-guard-20261022`; PR #13 squash merged. Image source and full reusable migration skill incorporated.
- The new Vercel project received a dedicated **production-environment** deployment from this branch; verified READY and builds 48 static SEO routes, 11 public image assets and 28 responsive WebP variants.
- The independent Vercel public-catalog relay returned HTTP 200 from the real Railway-backed catalog, tenant `sew-suite`, approved version `e06f162d-8684-4eef-89fa-57bcec31a4fa`, with eight published portfolio projects.
- Observed preview/staged production routes: home, FAQs, Reviews, Our Work, Services, Service Areas, Contact and Request Quote all HTTP 200, preview robots noindex correct. Correct Sew Suite branding confirmed by user visual review.
- Railway production catalog, staff backend, CRM API, artwork gateway, mail worker and backup job deployed. 2026-11-06 encrypted backup archive, remote upload and remote decryption PASS.
- Prior operator acceptance includes customer/office mail accepted, staff login/workflow, downloaded artwork, successful chat and voice closing; preserve as historical QA only. Before live switch, reverify on current prod code.
- Customer CRM artwork is not optimized or transformed. Google Review QR remains original vector/PNG.
- Build dependencies now have a synchronized package-lock and successful npm-ci validation.
- HTTPS and existing Vercel domain ownership verified for the old project. NO domain switch performed.

## Current intentional production holds (do not claim ready yet)
New Vercel project production env is still set to `false` for:
`RRS_PRODUCTION_INTAKE_ENABLED`,
`RRS_PRODUCTION_CHAT_ENABLED`,
`RRS_PRODUCTION_CHAT_LEADS_ENABLED`,
`RRS_PRODUCTION_VOICE_ENABLED`,
`RRS_PRODUCTION_ARTWORK_ENABLED`,
`RRS_PRODUCTION_MAIL_VERIFIED`,
`RRS_PRODUCTION_ARTWORK_VERIFIED`,
`RRS_PRODUCTION_RELEASE_VERIFIED`,
and `RRS_PRODUCTION_INDEXABLE`.
The `RRS_ARTWORK_BRIDGE_ENABLED` flag is also false. Do not flip verification flags merely to make preflight green; require corresponding evidence. The page's `/api/intake`, `/api/chat-lead`, and `/api/artwork` availability is expected false until live release.

Railway app/mailer/voice backend flags are separate. Mail worker most recently logged `delivery_enabled=false`, and voice gateway most recently logged `enabled=false`; confirm and activate these deliberately in the final controlled switch window. Do not mass-enable unrelated testing workers.

## Final controlled release sequence (owner approval required)
1. Record pre-switch project domain assignments, current `www` HTTPS success, previous old-project production deployment URL/ID, existing redirects and required registrar DNS. Keep Base44 operational.
2. Reconfirm automated Vercel build is READY, source code commit, correct Vercel project/team, current Railway Postgres+R2 backup integrity and last valid offsite decrypt receipt. Verify no unexpected pending Railway patch.
3. Confirm Turnstile site key/secret validity specifically for `www.sewsuite.com`. Recheck consent/TOS and sender mailbox permissions. Do not display or paste credentials in logs/chat.
4. Enable only the production services needed for live customer workflows in Railway (mail, CRM intake/chat and voice if requested). Use controlled authenticated smoke tests that are visibly marked as TEST, with customer/office notification and persisted CRM/artwork receipts. Verify idempotency and no duplicate sends.
5. After successful receipts set Vercel production release verification flags and feature toggles true as appropriate, then deploy an immutable production build. Verify `/api/public-catalog` (real Railway source), `/api/intake`, `/api/artwork`, `/api/chat?action=status`, `/api/chat-lead`, and `/api/voice?action=status`. Require successful readiness results; if any gate fails, leave old domain assignment intact.
6. Ensure `RRS_PRODUCTION_INDEXABLE=true` only when approved for the correct custom domain and only after all release gates pass. Test canonical URLs, robots and 48-route sitemap for `www.sewsuite.com`; confirm no indexation on `*.vercel.app` previews.
7. With explicit owner go-live approval, reassign `www.sewsuite.com` and `sewsuite.com` from the old Vercel project to `sewsuite-authentic-comparison`. Vercel documentation describes `vercel domains add www.sewsuite.com sewsuite-authentic-comparison --force` for a domain assigned to another project in the same team, or remove and re-add in project Domains settings. Apply apex-to-`www` redirect, and preserve SSL/TLS. Confirm DNS provider records still route to Vercel; do not change nameservers or email MX/TXT records merely because the website is moving.
8. On the final domain, verify home, 9 service categories, 20 service areas, 8 portfolio pages, reviews QR/button, FAQs, Contact and Request Quote across desktop/mobile. Submit one controlled live-domain inquiry with a small approved public test file, verify Railway CRM lead, office/customer mail and private-artwork download; test AI chat and voice hangup with an approved test inquiry. Verify no request UUID appears to users, and chat doesn't require a redundant manual submit.
9. Observe Vercel/Railway 4xx/5xx, mail outbox, storage, backup and latency. Maintain old Base44 fallback for rollback and don't delete the prior domain/source/project immediately.

## Immediate rollback
If DNS/SSL, page parity, public catalog, leads, mail, artwork, voice or indexing fails:
- Reassign `www.sewsuite.com` and apex to the prior Vercel project with its original redirect; verify that original site works.
- Disable new Vercel intake/chat/voice/artwork and indexability toggles as appropriate; stop outbound mail if necessary. Do not delete new CRM records or overwrite customer uploads.
- Log the failed check, original/new deployment identifiers, timestamp and restored traffic; investigate off-line in staging before another attempt.

## Tool limitations / owner action
This session has Vercel project read, deployment and domain-add capabilities but no supported project-domain removal tool; do not assume we can atomically move an already-attached domain from this chat. A controlled Vercel dashboard/CLI step may require the owner's interaction. Final custom-domain cutover approval must be distinct from image design approval.

## Final static SEO acceptance — 2026-11-06
- Eliminated a real sitemap/canonical host inconsistency: the original `public/sitemap.xml` listed all 48 URLs under `https://sewsuite.com`, while build-time canonical and robots expected `https://www.sewsuite.com`. All sitemap URLs now use the approved `www` host.
- Introduced `src/lib/sewSuiteCanonical.js` and applied it to static-route layout, service, service-area and portfolio detail React hydration, including LocalBusiness/Breadcrumb and Open Graph URLs; old signed Railway catalog remains unchanged.
- Added `tests/canonical-site-host.test.mjs` and amended sitemap acceptance test, included in `npm run build`. New Vercel production-environment deployment from the approved branch passed all build/SEO/image regressions.
- Latest verified production-stage deployment: `https://sewsuite-authentic-comparison-314qxmv3a.vercel.app`, READY. `/sitemap.xml` returned HTTP 200, 48 URLs all `www.sewsuite.com`; `/` canonical `https://www.sewsuite.com/`, `/api/public-catalog` HTTP 200 with correct Sew Suite name and catalog version. Preview/custom domain still noindex until explicit go-live toggles.
- Current authorized release status: CODE/SEO/IMAGE/CATALOG BUILD PASSED; LIVE CRM/MAIL/VOICE AND DOMAIN CUTOVER NOT YET ENABLED. Do not mislabel a website build as go-live readiness.
