# Sew Suite controlled preview quote/artwork acceptance

Owner explicitly authorized temporary one-synthetic-lead / one-PNG test using SSO-protected Vercel preview; this is NOT public cutover. Use the current Base44 www.sewsuite.com for actual customers.

Scope: preview git branch `sew-suite-catalog-version-guard-20261022`, alias `https://sewsuite-authentic-comparison.vercel.app`. `RRS_PRODUCTION_INTAKE_ENABLED=true` and `RRS_PRODUCTION_ARTWORK_ENABLED=true` were scoped to this branch only. Railway `sew-suite-crm-api` startup reported `enabled: true, configured: true`; Railway private artwork gateway reported `RRS_ARTWORK_GATE_READY true`; outgoing mail worker delivery variable explicitly set `false`. Do not enable mail, chat/voice, production Vercel target or DNS.

Test with a synthetic contact (never use a real customer identity). Project must be clearly marked acceptance test. Complete Cloudflare Turnstile, submit one quote with one small original sample PNG. Confirm saved lead and attachment in independent CRM with authorized staff sign-in and SHA/size, and email outbox held. After capture restore both preview flags to false and Railway intake/artwork flags to false, followed by a fresh preview build and audit. Do not treat completed UI submission as a legitimate customer order.
