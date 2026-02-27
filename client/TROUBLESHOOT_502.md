# Troubleshooting 502 Bad Gateway Error

A 502 Bad Gateway means nginx cannot connect to your backend server (Daphne). Here's how to fix it:

## Step 1: Check if Daphne is Running

```bash
# Check if Daphne process is running
ps aux | grep daphne

# Check if port 8000 is listening
sudo netstat -tlnp | grep 8000
# or
sudo ss -tlnp | grep 8000

# Check systemd service status
sudo systemctl status daphne
# or whatever your service name is
```

## Step 2: Check Daphne Logs

```bash
# If using systemd
journalctl -u daphne -n 50 --no-pager

# If running manually, check your log file
tail -f /path/to/daphne.log
```

## Step 3: Verify Daphne is Listening on Correct Interface

Daphne might be binding to a different interface. Check:

```bash
# See what's listening on port 8000
sudo lsof -i :8000
# or
sudo netstat -tlnp | grep 8000
```

If Daphne is listening on `0.0.0.0:8000` or `::1:8000`, that's fine. But if it's only on `127.0.0.1:8000`, make sure nginx can reach it.

## Step 4: Test Direct Connection

```bash
# Test if you can reach Daphne directly
curl http://127.0.0.1:8000/api/media/
# or
curl http://localhost:8000/api/media/

# Check if it responds
curl -v http://127.0.0.1:8000/
```

## Step 5: Check Nginx Error Logs

```bash
# Check nginx error log for specific error
sudo tail -50 /var/log/nginx/error.log

# Look for errors like:
# - "connect() failed (111: Connection refused)"
# - "upstream prematurely closed connection"
# - "upstream sent too big header"
```

## Step 6: Common Fixes

### Fix 1: Start/Restart Daphne

```bash
# If using systemd
sudo systemctl start daphne
sudo systemctl restart daphne

# If running manually, start it:
cd /home/ubuntu/server/goGaze_main
source /home/ubuntu/server/venv/bin/activate
daphne -b 127.0.0.1 -p 8000 goGaze_main.asgi:application
```

### Fix 2: Check Daphne Binding

Make sure Daphne is binding to `127.0.0.1:8000` (or `0.0.0.0:8000`):

```bash
# In your systemd service or startup script
daphne -b 127.0.0.1 -p 8000 goGaze_main.asgi:application
```

### Fix 3: Update Nginx Upstream (if needed)

If Daphne is on a different port or interface, update nginx:

```nginx
upstream daphne {
    server 127.0.0.1:8000;  # Make sure this matches where Daphne is running
    # Or if using Unix socket:
    # server unix:/path/to/daphne.sock;
}
```

### Fix 4: Check Firewall/SELinux

```bash
# Check if firewall is blocking
sudo ufw status
sudo iptables -L -n

# If needed, allow localhost connections (usually not needed)
```

### Fix 5: Check File Permissions

```bash
# Ensure nginx user can access the socket/port
# Usually not an issue for TCP connections, but check anyway
```

## Step 7: Verify Nginx Configuration

```bash
# Test nginx config
sudo nginx -t

# If config is valid, reload
sudo systemctl reload nginx
# or
sudo service nginx reload
```

## Step 8: Check for Port Conflicts

```bash
# See what's using port 8000
sudo lsof -i :8000

# If something else is using it, either:
# 1. Stop that service
# 2. Change Daphne to a different port
# 3. Update nginx upstream to match
```

## Quick Diagnostic Script

Run this to get a full picture:

```bash
#!/bin/bash
echo "=== Checking Daphne Process ==="
ps aux | grep daphne | grep -v grep

echo -e "\n=== Checking Port 8000 ==="
sudo netstat -tlnp | grep 8000

echo -e "\n=== Testing Connection ==="
curl -v http://127.0.0.1:8000/ 2>&1 | head -20

echo -e "\n=== Nginx Error Log (last 10 lines) ==="
sudo tail -10 /var/log/nginx/error.log

echo -e "\n=== Systemd Service Status ==="
sudo systemctl status daphne --no-pager -l
```

## Most Common Solutions

1. **Daphne is not running** → Start it: `sudo systemctl start daphne`
2. **Daphne crashed** → Check logs, fix the issue, restart
3. **Wrong port in nginx** → Update upstream to match Daphne's port
4. **Daphne binding to wrong interface** → Use `-b 127.0.0.1` flag
5. **Django/Daphne startup error** → Check application logs for Python errors

