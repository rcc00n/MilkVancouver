# Vancouver Milk Co (forked from MeatDirect)

Early scaffolding for the new Vancouver Milk Co monorepo, built from the original MeatDirect project. Includes a Django REST backend and a Vite + React frontend re-skinned for a Vancouver dairy brand.

## Backend (Django + DRF)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Key endpoints:
- `/health/` – simple JSON health check for Dokku or uptime monitors.
- `/api/products/`, `/api/orders/`, `/api/payments/...` – placeholder DRF views wired for expansion.

Settings live in `shop/settings/` (`base.py`, `local.py`, `prod.py`). Templates directory is configured as `BASE_DIR/templates`. Add `CORS_ALLOWED_ORIGINS` in the env or in `local.py` when wiring the frontend.

## Frontend (Vite + React + TS)

```bash
cd frontend
npm install
npm run dev
```

The frontend ships with basic catalog, product detail, cart, checkout, and success screens plus a Cart sidebar. API client falls back to mock products until real endpoints are ready. Vite dev server proxies `/api` and `/health` to `http://localhost:8000`.

## Docker

`docker-compose.yml` contains backend, frontend, and Postgres services. Backend defaults to SQLite unless you point settings to Postgres. Frontend image serves the built bundle via Nginx on port `4173`.

## Production (Dokku env)

- Copy `backend/.env.production.example` to `backend/.env.production` and fill the values. Generate a secret with:
  ```bash
  python - <<'PY'
  import secrets; print(secrets.token_urlsafe(64))
  PY
  ```
- Push the filled values to Dokku:
  ```bash
  dokku config:set meatdirect $(sed '/^#/d;/^$/d' backend/.env.production | xargs)
  ```
- Rebuild once config is in place: `dokku ps:rebuild meatdirect`
- Stripe: set both `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` on the backend. The frontend fetches the publishable key at runtime via `/api/payments/config/` (you can still set `VITE_STRIPE_PUBLISHABLE_KEY` when building locally).

## Repo structure

```
backend/   # Django project (shop) and apps (products, orders, payments)
frontend/  # Vite React app with layout, cart, product components
```
