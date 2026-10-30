# Sew Suite protected preview artwork gateway variable — 2026-10-30

Owner saved `RRS_ARTWORK_INTERNAL_KEY` as a sensitive Vercel environment variable scoped to Preview branch `sew-suite-catalog-version-guard-20261022`. The actual secret is never recorded here or in chat. Git commit triggers a new preview deployment of the current source with the new secret variable. `RRS_PRODUCTION_ARTWORK_ENABLED=false` and `RRS_PRODUCTION_INTAKE_ENABLED=false` remain unchanged and must not be turned on until full controlled acceptance tests pass.

A separate inadvertent production-scope Vercel key entry is also present and should be removed from Production only in the dashboard; do not touch the correct Preview-branch secret. No DNS change.
