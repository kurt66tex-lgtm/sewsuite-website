# Sew Suite protected synthetic quote test 2026-10-31

Owner submitted one synthetic quote from SSO-protected Vercel preview, received Quote Request Received and one artwork file securely attached. Railway CRM backend HTTP log: `POST /internal/lead` HTTP 202; Railway artwork gateway `POST /internal/artwork/prepare` HTTP 200 and `POST /internal/artwork/commit` HTTP 200.

Immediately after the acceptance screenshots, reverted the preview branch-scoped `RRS_PRODUCTION_INTAKE_ENABLED=false` and `RRS_PRODUCTION_ARTWORK_ENABLED=false`, plus Railway CRM `RRS_PRODUCTION_INTAKE_ENABLED=false`, `RRS_PRODUCTION_MAIL_READY=false`, and Railway artwork gateway `RRS_ARTWORK_ENABLED=false`. Railway mail worker `RRS_MAIL_DELIVERY_ENABLED=false` throughout. This commit rebuilds protected preview using disabled flags. No production DNS/mail/customer traffic changes.

Database lead/outbox and protected staff artwork readback remain to verify independently. The test lead should be archived or cleaned through an approved auditable process once verified, not treated as a customer order.
