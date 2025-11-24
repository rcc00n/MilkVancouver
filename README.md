# MeatDirect

Early scaffolding for MeatDirect's monorepo. Includes a Django REST backend and a Vite + React frontend.

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

## Repo structure

```
backend/   # Django project (shop) and apps (products, orders, payments)
frontend/  # Vite React app with layout, cart, product components
```
