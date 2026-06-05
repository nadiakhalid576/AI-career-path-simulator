# Render Deployment Guide

This guide will help you deploy the AI Career Path Simulator backend on Render.

## Prerequisites

1. **Render Account**: Create a free account at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub (must be public or connect GitHub account)
3. **Environment Variables**: Have your API keys ready (Google Gemini, Grok, etc.)

## Step-by-Step Deployment Instructions

### 1. Create a Web Service

1. Click **"New +"** and select **"Web Service"**
2. Connect your GitHub repository:
   - Click **"Connect account"** and authorize GitHub
   - Select the `AI-career-path-simulator` repository
3. Fill in the configuration:
   - **Name**: `career-path-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     pip install -r career_path_backend/requirements.txt && cd career_path_backend && python manage.py collectstatic --noinput
     ```
   - **Start Command**:
     ```bash
     cd career_path_backend && gunicorn career_path_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2
     ```

### 2. Set Environment Variables

In the Web Service settings, scroll to **"Environment"** and add these variables:

| Key | Value |
|-----|-------|
| `DEBUG` | `False` |
| `SECRET_KEY` | Generate a strong random string (e.g., use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`) |
| `GEMINI_API_KEY` | Your Google Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `XAI_API_KEY` | (Optional) Your xAI Grok API key |
| `PYTHONUNBUFFERED` | `true` |

### 3. Deploy

1. Click **"Create Web Service"**
2. Render will automatically start the deployment
3. Monitor the build logs in real-time
4. Once deployment is complete, you'll see a green "Live" status

## Verification

After deployment completes:

1. Check the **Logs** tab for any errors
2. Visit your deployment URL (format: `https://your-service-name.onrender.com`)
3. Test the API by accessing `/admin/` or your API endpoints

## Common Issues & Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'pkg_resources'`
**Solution**: ✅ Already fixed! We added `setuptools` and `wheel` to requirements.txt

### Issue: `ModuleNotFoundError: No module named 'dj_database_url'`
**Solution**: ✅ Already fixed! We added `dj-database-url` to requirements.txt

### Issue: Static files not loading
**Solution**: ✅ Already fixed! We added `whitenoise` middleware and proper static file configuration

### Issue: `ALLOWED_HOSTS` or CORS errors
**Solution**: Ensure your Render URL and frontend URL are in ALLOWED_HOSTS in settings.py. They already are by default.

## Useful Commands

### Local Testing Before Deployment

```bash
# Install dependencies
cd career_path_backend
pip install -r requirements.txt

# Run migrations locally
python manage.py migrate

# Collect static files
python manage.py collectstatic

# Run development server
python manage.py runserver 0.0.0.0:8000
```

### After Deployment

```bash
# SSH into Render instance (view logs instead)
# Access Render dashboard to view logs

# To trigger a manual redeploy:
# Push a new commit to your GitHub repository
```

## Environment-Specific Settings

The application uses SQLite database in both local and production environments:

- **Local Development**: DEBUG=True
- **Render Production**: DEBUG=False

The database file (`db.sqlite3`) is maintained in your repository and shared between environments.

## Next Steps

1. Update your frontend `.env` file to point to your Render backend URL:
   ```
   VITE_API_URL=https://your-service-name.onrender.com
   ```

2. Deploy your frontend to Netlify if you haven't already

3. Test the full application end-to-end

## Support

For issues:
1. Check Render's documentation: https://render.com/docs
2. Review Django deployment guide: https://docs.djangoproject.com/en/stable/howto/deployment/
3. Check the application logs on Render dashboard
