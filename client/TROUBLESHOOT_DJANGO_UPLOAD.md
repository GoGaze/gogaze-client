# Troubleshooting Django File Upload Issues

## Error Analysis

The nginx errors show:
1. **"upstream prematurely closed connection"** - Daphne is closing the connection before responding
2. **"upstream timed out"** - Daphne is taking too long to respond

This indicates the issue is in Django/Daphne, not nginx.

## Step 1: Check Daphne Logs

```bash
# Check Daphne service logs
sudo journalctl -u gogaze-daphne -n 100 --no-pager

# Or if running manually, check the console output
# Look for:
# - Python errors
# - Django exceptions
# - Memory errors
# - File size errors
```

## Step 2: Check Django Settings

Verify your Django `settings.py` has these settings:

```python
# File upload settings - CRITICAL
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB in bytes
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB in bytes
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# If using Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',  # Required for file uploads
        'rest_framework.parsers.FormParser',
    ],
}
```

## Step 3: Check Django View/Serializer

Your upload view should handle large files properly:

```python
# views.py or viewsets.py
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.response import Response

class MediaUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]  # CRITICAL
    
    def post(self, request):
        # Use request.FILES, not request.data for file uploads
        file = request.FILES.get('file')
        title = request.data.get('title', file.name if file else '')
        
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        
        # Your upload logic here
        # Make sure to handle large files efficiently
        # Consider streaming to S3 directly if possible
```

## Step 4: Check for Memory Issues

Large files can cause memory problems. Check:

```bash
# Check system memory
free -h

# Check if Daphne process is using too much memory
ps aux | grep daphne

# Monitor memory during upload
watch -n 1 'ps aux | grep daphne'
```

## Step 5: Enable Django Debug Logging

Add to `settings.py` temporarily:

```python
import logging

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': '/home/ubuntu/server/goGaze_main/django.log',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

Then check the log file:
```bash
tail -f /home/ubuntu/server/goGaze_main/django.log
```

## Step 6: Test Direct Upload to Daphne

Bypass nginx to test if Django is working:

```bash
# Test direct connection to Daphne
curl -X POST http://127.0.0.1:8000/api/media/ \
  -F "title=test" \
  -F "file=@/path/to/small/test/file.jpg"

# If this works, the issue is nginx configuration
# If this fails, the issue is Django
```

## Step 7: Check File Size Limits

Verify the file you're uploading is within limits:

```bash
# Check file size
ls -lh /path/to/your/file

# Should be less than 500MB
```

## Step 8: Common Django Issues

### Issue: File too large for memory

**Solution:** Stream file directly to S3 without loading into memory:

```python
import boto3
from django.core.files.uploadedfile import UploadedFile

def upload_to_s3(file: UploadedFile, bucket_name: str, key: str):
    s3_client = boto3.client('s3')
    
    # Upload in chunks to avoid memory issues
    s3_client.upload_fileobj(
        file,
        bucket_name,
        key,
        ExtraArgs={'ContentType': file.content_type}
    )
```

### Issue: Django form validation failing

**Solution:** Check your model/form:

```python
# models.py
class MediaFile(models.Model):
    file = models.FileField(upload_to='media/', max_length=500)
    title = models.CharField(max_length=255)
    
    # Make sure file field doesn't have size restrictions
```

### Issue: CSRF token issues

**Solution:** Verify CSRF settings:

```python
# settings.py
CSRF_TRUSTED_ORIGINS = [
    'http://13.233.206.39',
    'http://your-domain.com',
]

# For API endpoints, you might need to exempt CSRF
from django.views.decorators.csrf import csrf_exempt
```

## Step 9: Increase Daphne Worker Memory

If using multiple workers, increase memory limits:

```bash
# Edit systemd service
sudo nano /etc/systemd/system/gogaze-daphne.service

# Add memory limit (if needed)
[Service]
MemoryLimit=2G
```

## Step 10: Check S3 Configuration

If using S3, verify credentials and permissions:

```python
# Test S3 connection
python manage.py shell

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

# Test upload
test_file = ContentFile(b'test content')
filename = default_storage.save('test/test.txt', test_file)
print(f"Uploaded: {filename}")
print(f"URL: {default_storage.url(filename)}")
default_storage.delete(filename)
```

## Quick Diagnostic Script

Run this to check everything:

```bash
#!/bin/bash

echo "=== Checking Daphne Status ==="
sudo systemctl status gogaze-daphne --no-pager -l | head -20

echo -e "\n=== Recent Daphne Logs ==="
sudo journalctl -u gogaze-daphne -n 30 --no-pager

echo -e "\n=== Checking Django Settings ==="
cd ~/server/goGaze_main
source ~/server/venv/bin/activate
python manage.py shell << EOF
from django.conf import settings
print(f"FILE_UPLOAD_MAX_MEMORY_SIZE: {settings.FILE_UPLOAD_MAX_MEMORY_SIZE}")
print(f"DATA_UPLOAD_MAX_MEMORY_SIZE: {settings.DATA_UPLOAD_MAX_MEMORY_SIZE}")
print(f"AWS_STORAGE_BUCKET_NAME: {getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'Not set')}")
EOF

echo -e "\n=== System Memory ==="
free -h

echo -e "\n=== Disk Space ==="
df -h

echo -e "\n=== Testing Direct Connection ==="
curl -v http://127.0.0.1:8000/api/ 2>&1 | head -20
```

## Most Likely Solutions

1. **Django settings missing file upload limits** → Add `FILE_UPLOAD_MAX_MEMORY_SIZE`
2. **View not using MultiPartParser** → Add `parser_classes = [MultiPartParser, FormParser]`
3. **Memory exhaustion** → Stream files directly to S3
4. **Django error not being logged** → Enable debug logging
5. **File too large for Django to handle in memory** → Use chunked upload or streaming

## Next Steps

1. Check Daphne logs first: `sudo journalctl -u gogaze-daphne -n 100`
2. Verify Django settings have file upload limits
3. Test with a small file first, then gradually increase size
4. Monitor memory usage during upload
5. Check Django application logs for specific errors

