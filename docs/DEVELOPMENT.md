# Local development

The repository contains a React/TypeScript storefront and a Django REST backend.
Use a fresh local checkout and a Python version compatible with the Django version
resolved from [`backend/requirements.txt`](../backend/requirements.txt). Dependencies
are currently unpinned; the Dockerfile records a Python 3.11 base image, not a
guarantee that every future dependency resolution supports that interpreter.

## Backend with SQLite

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt

export DJANGO_DEBUG=True
export DJANGO_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
export DATABASE_URL=""
export DJANGO_DB_PATH="$PWD/backend/local.sqlite3"
export USE_S3=False
export EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

python backend/manage.py migrate
python backend/manage.py createsuperuser
python backend/manage.py runserver 127.0.0.1:8000
```

`manage.py` selects `shop.settings.local` unless overridden. An empty `DATABASE_URL`
uses SQLite at the explicit local path above. Keep the generated secret private.
`backend/.env` is loaded if present, so review a pre-existing file before using a
checkout. This basic local setup does not configure provider integrations; supply
your own local environment.

Use **http://127.0.0.1:8000/admin/** to add local content. Useful source-defined
endpoints include:

| Path | Purpose |
| --- | --- |
| `/health/` | Health response |
| `/api/products/` · `/api/categories/` | Catalogue |
| `/api/auth/` | Account, session and profile workflows |
| `/api/payments/config/` | Stripe public configuration |
| `/api/payments/checkout/` | Checkout operation |
| `/api/webhooks/stripe/` | Stripe event handling |
| `/api/delivery/` | Routes and driver operations |
| `/api/admin/` | Staff-only operational APIs |
| `/api/schema/` · `/api/docs/swagger/` · `/api/docs/redoc/` | API documentation |

Browse without real payment keys. Payment testing requires separately configured
Stripe **test** credentials and webhook configuration; the examples above do not
configure or exercise payments.

## Frontend

Use a maintained Node.js version compatible with Vite 5, for example Node.js 22.
In another terminal:

```bash
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

The configured port is **5173**. Vite proxies `/api` and `/health` to
`http://localhost:8000`; `VITE_API_BASE_URL` can select another API base at build time.
Products are fetched from the API, and an empty local catalogue stays empty.

```bash
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
```

`lint` runs `tsc --noEmit`. `build` writes `frontend/dist/`. A standalone Vite
preview still needs a running backend and correctly routed API requests; it does
not start Django or its workers.

## Workers and providers

The checked-in [`Procfile`](../Procfile) defines web, Celery worker and beat
processes. The worker consumes `default`, `emails`, `sms` and `logistics` queues.
The broker/result backend use `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` or
`REDIS_URL`, with a local Redis default.

The basic browsing setup above starts neither a worker nor Redis. Verification
email/SMS, scheduled cleanup and delivery tasks need their corresponding processes
and provider configuration. SendGrid, Twilio, S3 and mapping calls are external
integrations; configure development providers deliberately. This guide does not
start them or submit live provider requests.

## Existing checks

```bash
python backend/manage.py check
python backend/manage.py test
```

Tests are present under the account, catalogue, order, payment, delivery, notification
and staff-API apps. The commands above use Django's system checker and test runner.

## Hosting boundary

The Dockerfiles, settings and Compose file are deployment inputs. The current
Compose file publishes database and broker ports and contains development defaults;
review networking, credentials, TLS, process ownership and storage before selecting
a hosting configuration. Its service definitions alone do not prove that the
application uses the declared PostgreSQL service: `DATABASE_URL` selects the actual
database. The frontend build can be served by the Django image or by a separately
configured reverse proxy.

This project originated from [MeatDirect](https://github.com/rcc00n/MeatDirect).
Existing source history remains the attribution record. No licence is selected by
this documentation update.
