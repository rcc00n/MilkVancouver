<p align="center">
  <img src="frontend/src/assets/logo.svg" alt="Vancouver Milk Co. / VanMilk" width="300">
</p>

# Vancouver Milk Co.

**From the storefront to the delivery route.**

A dairy-commerce application with a React storefront, Django APIs and operational
tools for customer accounts, checkout and local delivery. This repository evolved
from [MeatDirect](https://github.com/rcc00n/MeatDirect); that project lineage is
retained while the interface and workflows use the Vancouver milk brand.

[Capabilities](#capabilities) · [Architecture](#architecture) ·
[Run locally](#run-locally) · [Development guide](docs/DEVELOPMENT.md)

## Capabilities

- **Storefront:** API-backed products and categories, product details, a persistent
  browser cart, checkout and customer account screens.
- **Accounts:** session authentication, profile and region data, email/phone
  verification and password-reset workflows.
- **Orders and payments:** order records, Stripe checkout configuration and
  webhook handling, with existing regression tests for checkout boundaries.
- **Delivery operations:** regional delivery days, route generation, driver
  assignment, upcoming routes and proof-of-delivery actions.
- **Administration and content:** Django admin and staff APIs for operational
  workflows, plus product, blog and contact content.
- **Background processing:** Celery tasks for notifications, cleanup and logistics;
  optional external mapping, email, SMS and media-storage integrations.

Payments, messaging, media storage and route optimization require separately
configured development providers. Product requests expose explicit loading/error
states; a fresh database starts with an empty catalogue.

## Architecture

```mermaid
flowchart LR
  Customer[Customer] --> UI[React storefront]
  Driver[Driver] --> UI
  UI --> API[Django REST API]
  Staff[Staff tools] --> API
  API --> DB[(Orders, accounts and routes)]
  API --> Tasks[Celery / Redis]
  Tasks --> Providers[Email / SMS / maps]
  API --> Stripe[Stripe integration]
```

| Layer | Stack |
| --- | --- |
| Frontend | React 18 · TypeScript · Vite 5 · Tailwind CSS · Radix UI |
| Backend | Python · Django · Django REST Framework · drf-spectacular |
| Data and jobs | SQLite locally; PostgreSQL via `DATABASE_URL` · Celery · Redis |
| Integrations | Stripe · SendGrid · Twilio · optional S3 media and Google route optimization |

## Run locally

Start from a fresh checkout with Python and Node.js available. The
[development guide](docs/DEVELOPMENT.md) provides the backend environment and SQLite
setup. After starting Django on **127.0.0.1:8000**, run:

```bash
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Open **http://127.0.0.1:5173**. Vite proxies `/api` and `/health` to Django. Populate
local products through Django admin; empty source data remains empty. Account
verification and background notifications additionally need a configured worker
and broker.

```bash
npm run lint   # TypeScript checking
npm run build
```

## Source guide

| Area | Entry point |
| --- | --- |
| Storefront and driver routes | [`frontend/src/App.tsx`](frontend/src/App.tsx) |
| Products and availability | [`backend/products`](backend/products) |
| Identity and profiles | [`backend/accounts`](backend/accounts) |
| Orders and checkout | [`backend/orders`](backend/orders) · [`backend/payments`](backend/payments) |
| Delivery routes and tasks | [`backend/delivery`](backend/delivery) |
| Staff operations | [`backend/admin_api`](backend/admin_api) |
| API schema and docs | [`backend/shop/urls.py`](backend/shop/urls.py) — `/api/docs/swagger/` |

See the [development guide](docs/DEVELOPMENT.md) for process boundaries, local
commands and the existing test locations. Deployment settings and Compose files
require environment review; they are not a one-command public-hosting recipe.
No project-wide licence file is present, and this documentation adds no new licence.
