# Sew Suite — missed CRM/Agency Controls migration: root cause and corrective gate (2026-11-09)

**Severity:** Release-blocking functional incompleteness, not cosmetic parity.

## Verified source and destination
- Source: original Base44 `Sew Suite` app `6aba8ad594aac8fa4dde76e6`.
- Destination website: independent Vercel project `sewsuite-authentic-comparison`. A READY deployment means build and delivery only; it does not certify CRM.
- Source React includes `src/pages/admin/AgencyControls.jsx`, `VoiceAIAddOnPanel.jsx` and extensive CRM/admin routes. These files appearing in the migrated repo was incorrectly treated as equivalent to a working migration.
- In migrated `src/api/base44Client.js`, only `getPublicBusinessSettings` is supported by `functions.invoke`; all other functions reject with `public_function_disabled`. `auth.me` rejects, and entity creation/update/deletion reject. The Agency Controls page calls `manageAgencyAccount`, which is not implemented in that adapter. Therefore copying its UI cannot provide actual independent agency management.
- Existing `docs/migration-factory/sew-suite-base44-control-parity-20261109.json` correctly marks source features PENDING and the combined migration release check fails until real evidence exists. This new additional diagnostic makes the specific missing-runtime failure explicit.

## Corrective action sequence
1. Preserve existing working public website, lead receipts, mail outbox, customer artwork, voice demos and all Base44 source/data for rollback. Do not flip telephony/LSA/billing/suspension switches to simulate progress.
2. Inventory **all** original CRM and admin features, data models, roles, functions, provider events and their dependencies. Include every admin route, not solely agency and public content. Capture source settings and record counts in secure inventory.
3. Implement true independent authentication, tenant isolation, agency-only permission checks, CRM CRUD, audit trails, files/links, APIs, and provider adapters in Railway/Postgres/R2. Do not silently call the original Base44 app at runtime.
4. Port Agency Controls in seven areas: Launch & Readiness, SEO, Website, Reputation, Google Local Services, AI Phone & Chat, Billing & Invoices. In each area implement all source controls, persistence, operational effects, negative paths and agency/client role boundaries.
5. Validate AI channels end-to-end: chat/phone/web switches, routing, custom schedule + DST, voice/model/prompt, secure knowledge entries, qualification, CRM creation, session closure and transfer, transcript/retention, verified usage/cost/markup/invoice lifecycle.
6. Validate broader CRM: leads/inbox, conversations, customers/contacts/service locations, quotes and jobs, artwork/proofs, production/fulfillment, calendars/team, review automations, reports, catalog/settings, role permissions and backups/restores.
7. On staging, run source-vs-destination field/behavior and authenticated role matrix tests, real provider integration tests, DB reads after writes, and rollback tests; record evidence and actual defects. Only after all applicable features are PASS or explicitly excluded by owner signoff, request authorization for production release.
8. Update the reusable migration skill and factory gate so a public READY build, website parity, or a handful of successful smoke tests never marks the full CRM migrated.

## Formal release rules
- `npm run migration:check` must pass the source-feature and release-evidence manifests **and** the independent-CRM runtime diagnostic.
- A rendered control, successful build, schema stub, static fixture, disabled adapter or mock provider does not count as a PASS.
- A feature may be intentionally excluded only with explicit owner authorization and recorded evidence; never silently remove it.
- Distinguish **public website live**, **CRM independently functional**, **Agency Controls independently functional**, **integration/provider verified**, and **factory migration approved** as separate statuses.
- Owner acceptance is required for actual phone/SIP activation, connected paid services, website suspension, invoice sending, DNS operations and any destructive data movement.

**Tracked remediation:** https://github.com/kurt66tex-lgtm/sewsuite-website/issues/18

This document is a defect record and acceptance protocol, **not** a claim that the missing CRM has now been implemented.
