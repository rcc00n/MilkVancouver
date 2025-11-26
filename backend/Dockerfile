FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/. .

# Build frontend assets with a relative API base (served by the same app) and static base
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ARG VITE_STRIPE_PUBLISHABLE_KEY=
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}
RUN npm run build -- --base=/static/

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy dependency list from backend folder
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/. .

# Add built frontend assets
COPY --from=frontend-build /frontend/dist /app/static
COPY --from=frontend-build /frontend/dist/index.html /app/templates/index.html

# Provide a placeholder DATABASE_URL at build time so prod settings can load; Dokku
# will override this env at runtime with the real Postgres URL.
ARG DATABASE_URL=postgres://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=${DATABASE_URL}

RUN DJANGO_SETTINGS_MODULE=shop.settings.prod DJANGO_SECRET_KEY=dev-secret-key DJANGO_ALLOWED_HOSTS=localhost python manage.py collectstatic --noinput

EXPOSE 8000

ENV DJANGO_SETTINGS_MODULE=shop.settings.prod

# Run migrations on container start to ensure Postgres has required tables,
# then launch the app.
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn shop.wsgi:application --bind 0.0.0.0:8000"]
