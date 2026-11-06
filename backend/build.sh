#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Create Admin User (Non-interactive)
python manage.py shell -c "from apps.accounts.models import User; u, created = User.objects.get_or_create(email='admin@scriptahub.com'); u.username='ScriptaAdmin'; u.set_password('admin123'); u.role='admin'; u.is_staff=True; u.is_superuser=True; u.is_active=True; u.save(); print('Admin check/creation complete')"