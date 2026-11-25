# Focused CI checks

`ci/checks.py` loads application models and existing code under an explicit synthetic
settings module. It forces an in-memory SQLite database, local file storage, memory
queues/caches and an in-memory email backend. It clears external-provider credentials
and blocks socket connections before Django initializes. No payment, email, bot,
OCR-model download, live database or deployment operation is performed.

The existing tests selected here are:

- `shop.tests.test_celery_config`
- `shop.tests.test_settings_and_email`
- `payments.tests.test_payment_service`

These are focused source checks, not full PostgreSQL, external-provider, OCR-model,
browser or production acceptance. PostgreSQL-specific constraints and concurrency
need their own isolated integration environment. Existing test assertions are not
modified or skipped by this setup.

The GitHub workflow also checks Python syntax and runs the interface build and existing TypeScript check. It does not deploy or use repository secrets. A failing check remains a failing
job; no passing badge or coverage percentage is asserted by this document.


## PostgreSQL business regressions

`python ci/business_checks.py` runs the explicitly listed existing business tests
against PostgreSQL 17.5. It loads the real URL configuration and migrations, uses
a temporary media directory, clears provider credentials, keeps queues/cache/email
local, and blocks Python socket connections except the loopback database service.
Payment, mapping and bot clients in the selected tests are mocked. This is a scoped
business suite, not a claim that every repository test or live integration ran.

Start a **disposable** database; never reuse a production database or volume:

```sh
docker run --rm -d --name reviewer-postgres \
  -e POSTGRES_USER=ci_review -e POSTGRES_PASSWORD=synthetic-local-only \
  -e POSTGRES_DB=review -p 127.0.0.1:55432:5432 postgres:17.5
# Wait until: docker exec reviewer-postgres pg_isready -U ci_review -d review
REVIEW_POSTGRES=1 REVIEW_POSTGRES_PORT=55432 python ci/business_checks.py
docker stop reviewer-postgres
```

Use a fresh checkout without private `.env` files. The test settings ignore
`DATABASE_URL` and arbitrary remote hosts; Django creates and destroys a separate
`test_review_*` database. The example password belongs only to this ephemeral CI
service. The GitHub `business-postgres` job runs the same command on its isolated
service container; it does not deploy and requires no repository secrets.

Fixture maintenance follows the current contract: product categories are foreign
keys; checkout supports delivery only and rejects retired pickup requests without
creating orders or calling Stripe. Historical pickup rows are still tested as
ineligible for route generation. Webhook fixtures use delivery orders.
