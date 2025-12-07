# 🔧 Complete NGINX CORS Fix Guide

## Problem
Your APIs stopped working after updating the nginx config. This is likely due to:
1. Syntax errors in the nginx config
2. Missing `always` flag on CORS headers
3. Headers not being applied to all response types

## 🚨 IMMEDIATE STEPS

### Step 1: Check Current Status

SSH into your server and run:

```bash
# Check if nginx is running
sudo systemctl status nginx

# Check for configuration errors
sudo nginx -t

# View recent error logs
sudo tail -50 /var/log/nginx/error.log
```

### Step 2: Backup Current Config

```bash
sudo cp /etc/nginx/sites-available/api.hyrmate.com /etc/nginx/sites-available/api.hyrmate.com.backup-$(date +%Y%m%d-%H%M%S)
```

### Step 3: Apply the Fixed Configuration

I've created a corrected config file: `nginx-cors-fixed.conf`

Copy the content from that file and apply it:

```bash
# Edit the nginx config
sudo nano /etc/nginx/sites-available/api.hyrmate.com

# Paste the entire content from nginx-cors-fixed.conf
# Save and exit (Ctrl+O, Enter, Ctrl+X)

# Test the configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# If reload fails, restart nginx
sudo systemctl restart nginx
```

### Step 4: Verify CORS Headers

Test if CORS headers are working:

```bash
# Test OPTIONS preflight
curl -I -X OPTIONS https://api.hyrmate.com/api/v1/jobs/batches \
  -H 'Origin: https://app.hyrmate.com' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: Content-Type'

# You should see:
# Access-Control-Allow-Origin: https://app.hyrmate.com
# Access-Control-Allow-Credentials: true
```

```bash
# Test actual GET request
curl -I -X GET https://api.hyrmate.com/api/v1/jobs/batches \
  -H 'Origin: https://app.hyrmate.com'

# You should see the same CORS headers
```

## 🔍 Debugging Common Issues

### Issue 1: "nginx: [emerg] unexpected end of file"
**Fix:** Check for missing closing braces `}` in your config

### Issue 2: "nginx: [emerg] invalid number of arguments in 'add_header'"
**Fix:** Make sure all `add_header` directives have exactly 3 parts:
```
add_header Header-Name "Header Value" always;
```

### Issue 3: Nginx won't start
**Fix:**
```bash
# Check what's wrong
sudo nginx -t

# View detailed error log
sudo journalctl -xeu nginx

# If still broken, restore backup
sudo cp /etc/nginx/sites-available/api.hyrmate.com.backup-* /etc/nginx/sites-available/api.hyrmate.com
sudo systemctl restart nginx
```

### Issue 4: CORS headers still missing
**Fix:** Make sure you reloaded nginx after changes:
```bash
sudo systemctl reload nginx
# or
sudo systemctl restart nginx
```

## ✅ Expected Headers in Browser

After fixing, when you check Network tab in Chrome DevTools, you should see:

**For OPTIONS request:**
```
Access-Control-Allow-Origin: https://app.hyrmate.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token
```

**For GET/POST requests:**
```
Access-Control-Allow-Origin: https://app.hyrmate.com
Access-Control-Allow-Credentials: true
```

## 🆘 If Nothing Works

If you still have issues:

1. **Temporarily disable CORS restrictions** (ONLY for testing):
```nginx
add_header Access-Control-Allow-Origin * always;
add_header Access-Control-Allow-Credentials true always;
```

2. **Check FastAPI CORS settings** in your backend:
```python
# In your FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.hyrmate.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

3. **Check Cloudflare settings**:
   - Go to your Cloudflare dashboard
   - SSL/TLS → Overview → Set to "Full (strict)"
   - Turn OFF "Rocket Loader" and "Auto Minify" temporarily

4. **Verify DNS**:
```bash
nslookup api.hyrmate.com
# Should point directly to your server IP (not Cloudflare proxy)
```

## 📞 Quick Test Command

Run this single command to test everything:

```bash
curl -v -X OPTIONS https://api.hyrmate.com/api/v1/jobs/batches \
  -H 'Origin: https://app.hyrmate.com' \
  -H 'Access-Control-Request-Method: GET' 2>&1 | grep -i "access-control"
```

Expected output:
```
< access-control-allow-origin: https://app.hyrmate.com
< access-control-allow-credentials: true
< access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
< access-control-allow-headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token
```

## 🎯 Key Points

1. **Always use the `always` flag**: This ensures headers appear on ALL responses (200, 204, 404, 500, etc.)
2. **Include credentials header**: Required when using `withCredentials: true` in frontend
3. **Test with curl first**: Don't rely on browser cache - test with curl to verify headers
4. **Check nginx logs**: `sudo tail -f /var/log/nginx/error.log` while testing

---

If you're still stuck after following this guide, share:
1. Output of `sudo nginx -t`
2. Output of the curl test command
3. Browser console error message
4. nginx error log (last 20 lines)
