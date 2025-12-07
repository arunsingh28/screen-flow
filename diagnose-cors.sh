#!/bin/bash

echo "============================================"
echo "CORS Diagnostic Script"
echo "============================================"
echo ""

# 1. Check if nginx is running
echo "1. Checking nginx status..."
sudo systemctl status nginx | grep Active
echo ""

# 2. Check nginx config
echo "2. Testing nginx config..."
sudo nginx -t
echo ""

# 3. Show current nginx config for this location
echo "3. Current nginx config (location /):"
grep -A 30 "location /" /etc/nginx/sites-available/api.hyrmate.com | head -35
echo ""

# 4. Test endpoint directly (bypassing nginx)
echo "4. Testing endpoint on FastAPI directly (127.0.0.1:8000)..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://127.0.0.1:8000/api/v1/jobs/activities?skip=0\&limit=5
echo ""

# 5. Test endpoint through nginx
echo "5. Testing endpoint through nginx (api.hyrmate.com)..."
curl -I https://api.hyrmate.com/api/v1/jobs/activities?skip=0\&limit=5 -H 'Origin: https://app.hyrmate.com' 2>&1 | grep -i "HTTP\|access-control"
echo ""

# 6. Test a working endpoint for comparison
echo "6. Testing working endpoint (/users/me) for comparison..."
curl -I https://api.hyrmate.com/api/v1/users/me -H 'Origin: https://app.hyrmate.com' 2>&1 | grep -i "HTTP\|access-control"
echo ""

# 7. Check nginx error logs
echo "7. Recent nginx errors:"
sudo tail -20 /var/log/nginx/error.log
echo ""

echo "============================================"
echo "Diagnostic complete. Share this output."
echo "============================================"
