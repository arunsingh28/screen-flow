# 🔍 Debugging Specific Endpoint Issues

## Problem
Some endpoints work (e.g., `/api/v1/users/me`) but others don't (e.g., `/api/v1/jobs/activities`).

The error for the failing endpoint:
```
No 'Access-Control-Allow-Origin' header is present on the requested resource
```

This is **different** from duplicate headers - it means NO headers at all.

## Why This Happens

When an endpoint returns an **error response** (404, 500, 401, etc.), nginx might not add CORS headers unless the `always` flag is used on ALL `add_header` directives.

## 🧪 Quick Test - Find Out What's Wrong

Run these commands on your server to diagnose:

### Test 1: Check if endpoint exists

```bash
# From your server (bypasses nginx)
curl -v http://127.0.0.1:8000/api/v1/jobs/activities?skip=0&limit=5

# What to look for:
# - Status code: 200 OK = endpoint exists
# - Status code: 404 = endpoint doesn't exist in FastAPI
# - Status code: 401/403 = authentication required
# - Status code: 500 = server error
```

### Test 2: Check with authentication

```bash
# If endpoint requires auth, test with session cookie
# First, get your session cookie from browser DevTools

curl -v http://127.0.0.1:8000/api/v1/jobs/activities?skip=0&limit=5 \
  -H 'Cookie: session=your-session-cookie-here'
```

### Test 3: Check CORS headers through nginx

```bash
# Test through nginx (from outside the server)
curl -v https://api.hyrmate.com/api/v1/jobs/activities?skip=0&limit=5 \
  -H 'Origin: https://app.hyrmate.com'

# Look for these headers in the response:
# access-control-allow-origin: https://app.hyrmate.com
# access-control-allow-credentials: true
```

### Test 4: Check nginx error logs

```bash
# Check for errors
sudo tail -50 /var/log/nginx/error.log | grep activities
```

## 🔧 Common Issues & Solutions

### Issue 1: Endpoint doesn't exist (404)

**Symptom:** Direct curl to FastAPI returns 404

**Solution:** Check your FastAPI routes. The endpoint might not be implemented yet.

```python
# In your FastAPI app, you should have:
@app.get("/api/v1/jobs/activities")
async def get_activities(skip: int = 0, limit: int = 5):
    # Your code here
    pass
```

### Issue 2: Authentication required (401)

**Symptom:** Works when logged in, fails when not

**Solution:** This is expected behavior. The endpoint requires authentication. Make sure your frontend is sending the session cookie.

Check browser DevTools → Network → Request Headers → Cookie

### Issue 3: CORS headers missing on error responses

**Symptom:**
- `/users/me` returns 200 → has CORS headers → works
- `/jobs/activities` returns 401 → no CORS headers → fails

**Solution:** Apply `nginx-cors-complete-fix.conf` which adds `always` to ALL `add_header` directives.

The key change:
```nginx
# Before (CORS headers only on 200 responses):
add_header Access-Control-Allow-Origin https://app.hyrmate.com;

# After (CORS headers on ALL responses including errors):
add_header Access-Control-Allow-Origin https://app.hyrmate.com always;
```

### Issue 4: FastAPI CORS middleware conflict

**Symptom:** Some endpoints work, others have duplicate headers

**Solution:** Make sure you have `proxy_hide_header` directives:

```nginx
proxy_hide_header Access-Control-Allow-Origin;
proxy_hide_header Access-Control-Allow-Credentials;
proxy_hide_header Access-Control-Allow-Methods;
proxy_hide_header Access-Control-Allow-Headers;
```

## 🚀 Apply Complete Fix

Use the updated `nginx-cors-complete-fix.conf`:

```bash
# 1. Backup
sudo cp /etc/nginx/sites-available/api.hyrmate.com /etc/nginx/sites-available/api.hyrmate.com.backup-$(date +%Y%m%d-%H%M%S)

# 2. Apply new config
sudo nano /etc/nginx/sites-available/api.hyrmate.com
# Paste content from nginx-cors-complete-fix.conf

# 3. Test
sudo nginx -t

# 4. Restart
sudo systemctl restart nginx

# 5. Clear browser cache!
# In Chrome: Ctrl+Shift+Delete → Clear cached images and files
```

## 📊 Comparison Table

| Endpoint | Status | Has CORS? | Why? |
|----------|--------|-----------|------|
| `/users/me` | 200 OK | ✅ Yes | Success response gets CORS headers |
| `/jobs/activities` | 401 Unauthorized | ❌ No | Error response missing `always` flag |

After applying `nginx-cors-complete-fix.conf`, both should have CORS headers.

## 🔍 Advanced Debugging

### Check all headers on working endpoint:

```bash
curl -I https://api.hyrmate.com/api/v1/users/me \
  -H 'Origin: https://app.hyrmate.com' \
  -H 'Cookie: your-session-cookie'

# Should see:
# HTTP/2 200
# access-control-allow-origin: https://app.hyrmate.com
# access-control-allow-credentials: true
```

### Check all headers on failing endpoint:

```bash
curl -I https://api.hyrmate.com/api/v1/jobs/activities?skip=0&limit=5 \
  -H 'Origin: https://app.hyrmate.com' \
  -H 'Cookie: your-session-cookie'

# Before fix might show:
# HTTP/2 401
# (missing CORS headers)

# After fix should show:
# HTTP/2 401
# access-control-allow-origin: https://app.hyrmate.com
# access-control-allow-credentials: true
```

### Compare responses side-by-side:

```bash
# Working endpoint
echo "=== /users/me ==="
curl -I https://api.hyrmate.com/api/v1/users/me \
  -H 'Origin: https://app.hyrmate.com' 2>&1 | grep -i access

echo ""
echo "=== /jobs/activities ==="
# Failing endpoint
curl -I https://api.hyrmate.com/api/v1/jobs/activities?skip=0&limit=5 \
  -H 'Origin: https://app.hyrmate.com' 2>&1 | grep -i access
```

Both should show the same CORS headers.

## ✅ Verification

After applying the complete fix:

1. ✅ Both endpoints return CORS headers (even on errors)
2. ✅ Browser console shows no CORS errors
3. ✅ `curl` tests show headers on all responses
4. ✅ API calls work in your frontend

## 💡 Key Takeaway

The `always` flag is CRITICAL:

```nginx
# ❌ WRONG - only adds headers on success (2xx) responses
add_header Access-Control-Allow-Origin https://app.hyrmate.com;

# ✅ CORRECT - adds headers on ALL responses (2xx, 4xx, 5xx)
add_header Access-Control-Allow-Origin https://app.hyrmate.com always;
```

Without `always`, error responses (401, 404, 500) won't have CORS headers, and the browser will block them.

---

**Next Steps:**

1. Apply `nginx-cors-complete-fix.conf`
2. Run the curl tests above
3. Clear browser cache
4. Check if both endpoints work

If still having issues, share the output of the curl commands above.
