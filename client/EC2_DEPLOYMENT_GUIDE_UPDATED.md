# GoGaze Server - EC2 Deployment Guide (Updated)

Complete guide to deploy the GoGaze Django backend on AWS EC2 with Supabase PostgreSQL and S3 storage.

## 🏗️ Architecture Overview

- **Backend**: Django 4.2 with Django REST Framework
- **Database**: Supabase PostgreSQL
- **Storage**: AWS S3 (for media files)
- **WebSocket**: Django Channels with Redis
- **Task Queue**: Celery with Redis
- **ASGI Server**: Daphne
- **Video Processing**: FFmpeg (background tasks)

---

## 📋 Prerequisites

### AWS Resources Required:
1. **EC2 Instance** (Ubuntu 22.04 LTS recommended)
2. **S3 Bucket** (for media storage)
3. **IAM User** with S3 access
4. **Security Group** with ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (Dev)

### External Services:
1. **Supabase Account** (for PostgreSQL database)
2. **Domain Name** (optional, for production)

---

## 🚀 EC2 Instance Setup

### Step 1: Launch EC2 Instance

```bash
# Recommended specs:
# - Instance Type: t3.medium or larger (2 vCPU, 4GB RAM minimum)
# - AMI: Ubuntu Server 22.04 LTS
# - Storage: 20GB+ GP3 SSD
# - Security Group: Allow ports 22, 80, 443, 8000
```

### Step 2: Connect to EC2

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system packages
sudo apt update && sudo apt upgrade -y
```

---

## 📦 Install System Dependencies

### Install Python 3.11+

```bash
# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Make Python 3.11 default
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
```

### Install Required System Packages

```bash
# Install essential build tools
sudo apt install -y build-essential libpq-dev git curl wget

# Install Redis (for Channels and Celery)
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install FFmpeg (for video processing)
sudo apt install -y ffmpeg

# Install Nginx (for production)
sudo apt install -y nginx

# Install PostgreSQL client tools (optional, for debugging)
sudo apt install -y postgresql-client
```

### Verify Installations

```bash
python3 --version  # Should show 3.11+
redis-cli ping     # Should return PONG
ffmpeg -version    # Should show FFmpeg version
nginx -v           # Should show Nginx version
```

---

## 🔧 Application Setup

### Step 1: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone the repository
git clone https://github.com/GoGaze/server.git
cd server
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### Step 3: Install Python Dependencies

```bash
# Install all required packages
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following configuration:

```bash
# Django Settings
SECRET_KEY='your-secret-key-generate-a-strong-one'
DEBUG=False
ALLOWED_HOSTS=your-ec2-ip,your-domain.com

# Database Configuration (Supabase)
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-supabase-password
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432

# AWS S3 Configuration
USE_S3=True
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=ap-south-1
```

**Generate a strong SECRET_KEY:**
```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### Step 5: Update Django Settings for Production

Edit `goGaze_main/goGaze_main/settings.py`:

```python
# Add your EC2 IP and domain to ALLOWED_HOSTS
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Update CSRF_TRUSTED_ORIGINS for production
CSRF_TRUSTED_ORIGINS = [
    'http://your-ec2-ip',
    'https://your-domain.com',
]

# IMPORTANT: File upload settings for large files (500MB)
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB in bytes
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000  # 500MB in bytes
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000
```

---

## 🗄️ Database Setup

### Step 1: Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **Database**
4. Copy connection details:
   - Host: `db.xxxxx.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: Your database password

### Step 2: Run Migrations

```bash
cd ~/server/goGaze_main

# Run migrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### Step 3: Verify Database Connection

```bash
# Test connection
python manage.py dbshell
# Type \q to exit
```

---

## ☁️ AWS S3 Setup

### Step 1: Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://your-bucket-name --region ap-south-1
```

Or via AWS Console:
1. Go to [S3 Console](https://s3.console.aws.amazon.com/)
2. Click **Create bucket**
3. Name: `your-bucket-name`
4. Region: `ap-south-1` (Mumbai)
5. Uncheck "Block all public access"
6. Create bucket

### Step 2: Configure CORS

Add CORS policy to your bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

### Step 3: Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Create new user with programmatic access
3. Attach policy: `AmazonS3FullAccess`
4. Save Access Key ID and Secret Access Key
5. Add to `.env` file

---

## 🔄 Process Management with Systemd

### 1. Daphne Service (ASGI Server)

Create `/etc/systemd/system/gogaze-daphne.service`:

```bash
sudo nano /etc/systemd/system/gogaze-daphne.service
```

```ini
[Unit]
Description=GoGaze Daphne ASGI Server
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/server/goGaze_main
Environment="PATH=/home/ubuntu/server/venv/bin"
ExecStart=/home/ubuntu/server/venv/bin/daphne -b 127.0.0.1 -p 8000 goGaze_main.asgi:application
Restart=always
RestartSec=3
TimeoutStartSec=600
TimeoutStopSec=600

[Install]
WantedBy=multi-user.target
```

**Important Notes:**
- Daphne must bind to `127.0.0.1:8000` (not `0.0.0.0`) for nginx to connect
- Added timeout settings for large file uploads

### 2. Celery Worker Service

Create `/etc/systemd/system/gogaze-celery.service`:

```bash
sudo nano /etc/systemd/system/gogaze-celery.service
```

```ini
[Unit]
Description=GoGaze Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/server/goGaze_main
Environment="PATH=/home/ubuntu/server/venv/bin"
ExecStart=/home/ubuntu/server/venv/bin/celery -A goGaze_main worker --loglevel=info --detach
ExecStop=/bin/kill -s TERM $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Start and Enable Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start services
sudo systemctl start gogaze-daphne
sudo systemctl start gogaze-celery

# Enable services to start on boot
sudo systemctl enable gogaze-daphne
sudo systemctl enable gogaze-celery
sudo systemctl enable redis-server

# Check status
sudo systemctl status gogaze-daphne
sudo systemctl status gogaze-celery
sudo systemctl status redis-server
```

---

## 🌐 Nginx Configuration (Production) - UPDATED FOR LARGE FILES

### Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/gogaze
```

**IMPORTANT: Use this updated configuration that supports 500MB file uploads:**

```nginx
upstream daphne {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-ec2-ip your-domain.com;

    # Global settings for large file uploads
    client_max_body_size 500M;
    client_body_timeout 600s;  # 10 minutes for large uploads
    client_body_buffer_size 1M;

    # Static files
    location /static/ {
        alias /home/ubuntu/server/goGaze_main/staticfiles/;
    }

    # Media files (if not using S3)
    location /media/ {
        alias /home/ubuntu/server/goGaze_main/media/;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://daphne;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Upload endpoint - specific configuration for large file uploads
    location /api/media/ {
        client_max_body_size 500M;
        client_body_timeout 600s;  # 10 minutes
        client_body_buffer_size 1M;
        
        proxy_pass http://daphne;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Extended timeouts for large file uploads (10 minutes)
        proxy_connect_timeout 60s;
        proxy_send_timeout 600s;  # 10 minutes
        proxy_read_timeout 600s;  # 10 minutes
        
        # Disable buffering for large uploads (prevents memory issues)
        proxy_request_buffering off;
        proxy_buffering off;
        
        # Additional headers for large uploads
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
    }

    # API and Admin
    location / {
        proxy_pass http://daphne;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Standard timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Enable Nginx Configuration

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/gogaze /etc/nginx/sites-enabled/

# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

**Key Configuration Points:**
- `client_max_body_size 500M` - Allows files up to 500MB
- `client_body_timeout 600s` - 10 minute timeout for uploads
- `proxy_send_timeout 600s` - 10 minute timeout for proxy
- `proxy_read_timeout 600s` - 10 minute timeout for reading response
- `proxy_request_buffering off` - Disables buffering for large files
- Specific `/api/media/` location block with optimized settings

---

## 🔒 SSL/HTTPS Setup (Optional but Recommended)

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate

```bash
# For a domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts
# Certbot will automatically configure Nginx for HTTPS
```

### Auto-renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Certbot auto-renewal is enabled by default
```

---

## 🔍 Monitoring & Logs

### View Application Logs

```bash
# Daphne logs
sudo journalctl -u gogaze-daphne -f

# Celery logs
sudo journalctl -u gogaze-celery -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### Monitor System Resources

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Check running services
sudo systemctl status gogaze-daphne
sudo systemctl status gogaze-celery
sudo systemctl status nginx
sudo systemctl status redis-server
```

### Troubleshooting 502/504 Errors

```bash
# Check if Daphne is running
sudo systemctl status gogaze-daphne
ps aux | grep daphne

# Check if port 8000 is listening
sudo netstat -tlnp | grep 8000

# Test direct connection to Daphne
curl http://127.0.0.1:8000/

# Check nginx error logs
sudo tail -50 /var/log/nginx/error.log

# Check Daphne logs for errors
sudo journalctl -u gogaze-daphne -n 50 --no-pager
```

---

## 🧪 Testing the Deployment

### 1. Test API Endpoint

```bash
curl http://your-ec2-ip/api/
```

### 2. Test Admin Interface

Visit: `http://your-ec2-ip/admin/`

### 3. Test File Upload (Large Files)

```bash
# Test with a large file (create a test file first)
dd if=/dev/zero of=test_100mb.bin bs=1M count=100

# Upload via curl
curl -X POST http://your-ec2-ip/api/media/ \
  -F "title=test_file" \
  -F "file=@test_100mb.bin"

# Clean up
rm test_100mb.bin
```

### 4. Test WebSocket Connection

```javascript
const ws = new WebSocket('ws://your-ec2-ip/ws/display/device_001/');
ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', event.data);
```

### 5. Test File Upload to S3

```bash
# Via Django shell
cd ~/server/goGaze_main
python manage.py shell

# In Python shell:
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

test_content = ContentFile(b'Hello, S3!')
filename = default_storage.save('test/test.txt', test_content)
print(f"File URL: {default_storage.url(filename)}")
default_storage.delete(filename)
```

---

## 🔄 Deployment Updates

### Pull Latest Changes

```bash
cd ~/server
git pull origin main
```

### Restart Services

```bash
# Activate virtual environment
source ~/server/venv/bin/activate

# Install new dependencies
pip install -r requirements.txt

# Run migrations
cd goGaze_main
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart services
sudo systemctl restart gogaze-daphne
sudo systemctl restart gogaze-celery
```

---

## 🛠️ Troubleshooting

### Issue: 502 Bad Gateway

**Symptoms:** Nginx returns 502 error

**Solutions:**
1. Check if Daphne is running: `sudo systemctl status gogaze-daphne`
2. Check if port 8000 is listening: `sudo netstat -tlnp | grep 8000`
3. Test direct connection: `curl http://127.0.0.1:8000/`
4. Check Daphne logs: `sudo journalctl -u gogaze-daphne -n 50`
5. Verify Daphne is binding to `127.0.0.1:8000` (not `0.0.0.0:8000`)
6. Restart Daphne: `sudo systemctl restart gogaze-daphne`

### Issue: 504 Gateway Timeout

**Symptoms:** Uploads timeout after 60 seconds

**Solutions:**
1. Verify nginx timeouts are set to 600s (10 minutes)
2. Check Django settings for `FILE_UPLOAD_MAX_MEMORY_SIZE`
3. Verify Daphne service has `TimeoutStartSec=600`
4. Check disk space: `df -h`
5. Monitor system resources: `htop`

### Issue: Can't connect to database

```bash
# Check Supabase connection
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Verify .env file
cat ~/server/.env | grep DB_
```

### Issue: Redis connection failed

```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis
redis-cli ping

# Restart Redis
sudo systemctl restart redis-server
```

### Issue: S3 upload failed

```bash
# Check AWS credentials
aws s3 ls s3://your-bucket-name/

# Test S3 access
python manage.py shell
>>> from django.conf import settings
>>> print(settings.AWS_ACCESS_KEY_ID)
>>> print(settings.AWS_STORAGE_BUCKET_NAME)
```

### Issue: Permission denied

```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu ~/server

# Fix permissions
chmod +x ~/server/venv/bin/*
```

### Issue: Service won't start

```bash
# Check service logs
sudo journalctl -u gogaze-daphne -n 50
sudo journalctl -u gogaze-celery -n 50

# Restart services
sudo systemctl restart gogaze-daphne
sudo systemctl restart gogaze-celery
```

---

## 📊 Performance Optimization

### Enable Gzip Compression (Nginx)

Add to nginx config:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### Configure Redis Persistence

```bash
sudo nano /etc/redis/redis.conf

# Enable AOF persistence
appendonly yes
appendfsync everysec
```

### Optimize PostgreSQL Connection Pooling

In `settings.py`:

```python
DATABASES = {
    'default': {
        # ... existing config ...
        'CONN_MAX_AGE': 600,  # Keep connections alive for 10 minutes
    }
}
```

---

## 🔐 Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall (UFW)
- [ ] Use HTTPS/SSL
- [ ] Set `DEBUG=False` in production
- [ ] Configure proper CORS settings
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Use strong SECRET_KEY
- [ ] Restrict SSH access
- [ ] Enable fail2ban

### Enable Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📚 Additional Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Celery Documentation](https://docs.celeryproject.org/)

---

## 📞 Support

For issues or questions:
- GitHub Issues: [https://github.com/GoGaze/server/issues](https://github.com/GoGaze/server/issues)
- Documentation: Check API_DOCUMENTATION.md

---

**Last Updated**: October 27, 2025
**Changes**: Updated nginx configuration for 500MB file uploads with extended timeouts

