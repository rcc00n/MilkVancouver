FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy dependency list from backend folder
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/. .

RUN DJANGO_SETTINGS_MODULE=shop.settings.prod DJANGO_SECRET_KEY=dev-secret-key DJANGO_ALLOWED_HOSTS=localhost python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "shop.wsgi:application", "--bind", "0.0.0.0:8000"]
