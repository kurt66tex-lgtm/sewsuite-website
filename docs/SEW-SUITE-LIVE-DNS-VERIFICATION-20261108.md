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
