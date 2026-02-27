# Django Settings Update for Large File Uploads

The 504 Gateway Timeout is likely because Django/Daphne needs to be configured to handle large file uploads. Update your Django `settings.py`:

## Required Django Settings

```python
# settings.py

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB in bytes
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB in bytes
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# For handling large files, use file-based uploads instead of memory
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

# If using Django REST Framework
REST_FRAMEWORK = {
    # ... your existing settings ...
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}
```

## Daphne Configuration

If you're running Daphne, you may need to update your systemd service or startup script:

### Systemd Service Example

```ini
[Unit]
Description=Daphne ASGI Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/server/goGaze_main
Environment="PATH=/home/ubuntu/server/venv/bin"
ExecStart=/home/ubuntu/server/venv/bin/daphne -b 127.0.0.1 -p 8000 goGaze_main.asgi:application
Restart=always
RestartSec=10

# Timeout settings (if your systemd supports it)
TimeoutStartSec=600
TimeoutStopSec=600

[Install]
WantedBy=multi-user.target
```

### Daphne Command with Timeout

```bash
daphne -b 127.0.0.1 -p 8000 \
    --proxy-headers \
    --timeout-keep-alive 600 \
    goGaze_main.asgi:application
```

## Gunicorn Configuration (if using Gunicorn instead)

If you're using Gunicorn with Uvicorn workers:

```python
# gunicorn_config.py
bind = "127.0.0.1:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 600  # 10 minutes
keepalive = 120
max_requests = 1000
max_requests_jitter = 50
```

## Additional Checks

1. **Check Django View/Serializer**: Ensure your upload view can handle large files:
   ```python
   # views.py or serializers.py
   class MediaUploadView(APIView):
       parser_classes = [MultiPartParser, FormParser]
       
       def post(self, request):
           # Your upload logic
           # Consider using request.FILES.get('file') instead of request.data
           pass
   ```

2. **Check Disk Space**: Ensure you have enough disk space for uploads

3. **Check File Permissions**: Ensure Django can write to the media directory:
   ```bash
   sudo chown -R ubuntu:ubuntu /home/ubuntu/server/goGaze_main/media/
   sudo chmod -R 755 /home/ubuntu/server/goGaze_main/media/
   ```

4. **Monitor Logs**: Check both nginx and Django logs:
   ```bash
   # Nginx error log
   sudo tail -f /var/log/nginx/error.log
   
   # Django/Daphne logs
   journalctl -u daphne -f
   # or
   tail -f /path/to/your/django.log
   ```

## Testing

After making changes:

1. Restart Daphne/Gunicorn:
   ```bash
   sudo systemctl restart daphne
   # or
   sudo systemctl restart gunicorn
   ```

2. Test nginx config:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. Test with a smaller file first, then gradually increase size

