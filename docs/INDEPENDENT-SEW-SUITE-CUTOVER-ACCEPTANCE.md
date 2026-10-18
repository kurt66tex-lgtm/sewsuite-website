# Sew Suite independent cutover acceptance (not yet approved)
Authoritative design source: Base44 app **Sew Suite**, ID `6aba8ad594aac8fa4dde76e6`.
Keep the Base44 app, data and settings intact, retained and accessible. DNS migration is not deletion.
## Hard release gates
- [x] Correct Base44-source React/Vite site and visual review in independent Vercel comparison project
- [x] Preserve public hero/logo/portfolio images independently
- [x] Independent bounded demo chat (does not submit leads, attachments or customer notifications)
- [x] Independent Railway voice provider connectivity and restricted session ledger
- [x] Encrypted Cloudflare R2 database backup uploaded and remote decryption verified after voice-schema permission repair
- [ ] Quote form: Railway Postgres transactional lead + idempotent receipt + customer/office notifications through independent mailbox, verified real workflow
- [ ] Artwork uploads: private R2 signed upload, MIME and size validation, tenant scoped access, CRM attachment retrieval
- [ ] AI chat: conversation persistence, confirmed lead capture, attachment support, safety escalation and rate limiting
- [ ] Web voice: complete one real audio test, tool calls and durable finalize, no duplicate leads or charges
- [ ] Phone/SIP: independent webhook/sideband, provider signature verification, runtime logging, real phone test and safe call-routing rollback
- [ ] Independent CRM staff/customer auth, roles, catalog/settings, quote, proof, production, fulfilment, review and agency controls compared to Base44
- [ ] Reviews, GBP and other connected integrations configured and verified
- [ ] Mobile/desktop and page-by-page parity (user final signoff), SEO metadata, robots and Search Console parity
- [ ] Offsite backup + actual restore rehearsal for final schema and private files
- [ ] No Base44 SDK/function calls on production public pages, workflows or billing
- [ ] Vercel comparison origin/dedicated domain protection and safe mail deliverability
- [ ] Explicit user approval for production cutover and agreed rollback window

## Domain cutover (DO NOT EXECUTE EARLY)
- Currently `www.sewsuite.com` and `sewsuite.com` are assigned to existing Vercel project `sewsuite-website-dlur` (ID `prj_JRfineZaMpyZk6lccNSV5jb9L3QA`).
- The approved independent comparison build resides on **different** Vercel project `sewsuite-authentic-comparison` (ID `prj_I7bHRldBYxY7lezBP8W4g61OGPOx`).
- For the final swap, preserve the former project's config and deployment, then reassign the domains **only with explicit owner approval**; leave Base44 app untouched. Confirm apex redirection and HTTPS, verify rollback.
- Do not transfer the domain to the earlier incorrect prelaunch project.
