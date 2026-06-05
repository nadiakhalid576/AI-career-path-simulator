#!/bin/bash
set -e

# Navigate to backend directory
cd career_path_backend

echo "==> Current directory: $(pwd)"
echo "==> Files in current directory:"
ls -la

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Build completed successfully!"
