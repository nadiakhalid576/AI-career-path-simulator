web: cd career_path_backend && gunicorn career_path_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2
release: cd career_path_backend && python manage.py collectstatic --noinput
