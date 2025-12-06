web: gunicorn shop.wsgi:application --bind 0.0.0.0:8000 --timeout 120 --access-logfile - --error-logfile -
worker: celery -A shop worker -l info -Q default,emails,sms,logistics
beat: celery -A shop beat -l info