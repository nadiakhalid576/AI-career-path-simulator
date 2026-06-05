#!/bin/bash
set -e

echo "==> Installing Python dependencies..."
pip install -r career_path_backend/requirements.txt

echo "==> Collecting static files..."
cd career_path_backend
python manage.py collectstatic --noinput

echo "==> Build completed successfully!"
