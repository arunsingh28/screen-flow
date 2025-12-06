# Production Deployment Guide

## WebSocket Issues on Production (Cloudflare + Nginx)

### Problem

CVs upload but don't reflect immediately. After refresh, changes appear. This indicates **WebSocket connection is not working** on production.

### Root Causes

1. **Cloudflare WebSocket Timeout**: 100 seconds on free/pro plans
2. **Missing Nginx WebSocket Headers**: Improper proxy configuration
3. **No Reconnection Logic**: Client doesn't reconnect when WebSocket drops
4. **SSL/WSS Protocol Mismatch**: Using `ws://` instead of `wss://` with Cloudflare SSL

---

## Solution 1: Configure Cloudflare

### Step 1: Enable WebSocket in Cloudflare

1. Login to Cloudflare Dashboard
2. Select your domain
3. Go to **Network** tab
4. Enable **WebSockets** (should be ON by default)

### Step 2: Set SSL/TLS Mode

1. Go to **SSL/TLS** tab
2. Set encryption mode to **Full** or **Full (strict)**
3. This ensures proper SSL between Cloudflare and your origin server

### Step 3: Disable Rocket Loader (if enabled)

1. Go to **Speed** > **Optimization**
2. Disable **Rocket Loader** (can interfere with WebSocket)

### Step 4: Configure Page Rules (Optional)

Create a page rule to disable caching for WebSocket endpoints:

**Pattern**: `yourdomain.com/api/v1/cv-processing/ws/*`

**Settings**:
- Cache Level: Bypass
- Disable Performance

---

## Solution 2: Update Nginx Configuration

### Current Config (Your File)

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Updated Config (Recommended)

**File**: `/etc/nginx/nginx.conf`

Add this in the `http {}` block:

```nginx
http {
    # ... existing config ...

    # WebSocket upgrade mapping
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    # ... rest of config ...
}
```

**File**: `/etc/nginx/sites-available/screen-flow`

```nginx
server {
    listen 80;
    server_name _;  # Replace with your domain if needed

    # Increase client body size for CV uploads
    client_max_body_size 50M;

    # CRITICAL: Increase timeouts for WebSocket
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    # Main application
    location / {
        proxy_pass http://127.0.0.1:8000;

        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_buffering off;
    }

    # Dedicated WebSocket location (better control)
    location /api/v1/cv-processing/ws/ {
        proxy_pass http://127.0.0.1:8000;

        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # CRITICAL: Disable buffering and caching
        proxy_buffering off;
        proxy_cache off;

        # Long timeouts for WebSocket (2 hours)
        proxy_connect_timeout 7200s;
        proxy_send_timeout 7200s;
        proxy_read_timeout 7200s;
        send_timeout 7200s;
    }
}
```

### Apply Configuration

```bash
# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Or restart if needed
sudo systemctl restart nginx
```

---

## Solution 3: Update Frontend WebSocket Code

### Problem

Frontend needs to:
1. Use `wss://` (secure WebSocket) with Cloudflare SSL
2. Reconnect automatically when connection drops
3. Send heartbeats to keep connection alive

### Solution: Use Reconnecting WebSocket

The `frontend/utils/websocket.ts` file has been created with automatic reconnection.

**Usage Example**:

```typescript
import { ReconnectingWebSocket } from '@/utils/websocket';

// In your React component
const [ws, setWs] = useState<ReconnectingWebSocket | null>(null);

useEffect(() => {
  const websocket = new ReconnectingWebSocket({
    url: `/api/v1/cv-processing/ws/${userId}`,
    onMessage: (data) => {
      console.log('Received:', data);

      if (data.type === 'cv_progress') {
        // Update CV progress UI
        updateCVProgress(data);
      }

      if (data.type === 'batch_progress') {
        // Update batch progress UI
        updateBatchProgress(data);
      }
    },
    onConnect: () => {
      console.log('WebSocket connected');
      // Show connection indicator
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
      // Show disconnection indicator
    },
    reconnectInterval: 3000,  // Retry every 3 seconds
    heartbeatInterval: 30000, // Ping every 30 seconds
  });

  setWs(websocket);

  return () => {
    websocket.close();
  };
}, [userId]);
```

**Features**:
- ✅ Automatic protocol detection (`ws://` or `wss://`)
- ✅ Exponential backoff reconnection
- ✅ Heartbeat to keep connection alive
- ✅ Handles Cloudflare 100-second timeout
- ✅ Logging for debugging

---

## Solution 4: Backend WebSocket Heartbeat

The backend already supports heartbeat in `cv_processing.py`:

```python
@router.websocket("/ws/{user_id}")
async def cv_processing_websocket(websocket: WebSocket, user_id: str):
    # ... connection code ...

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)

                # Handle ping/pong
                if data == "ping":
                    await websocket.send_json({"type": "pong"})

            except asyncio.TimeoutError:
                # Send periodic heartbeat
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except:
                    break
    # ... rest of code ...
```

This sends a heartbeat every 30 seconds, keeping the connection alive.

---

## Verification Steps

### 1. Check Nginx Configuration

```bash
# Test Nginx config
sudo nginx -t

# Check if Nginx is running
sudo systemctl status nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 2. Check Backend Logs

```bash
# View FastAPI logs
docker-compose logs -f api

# Check WebSocket connections
docker-compose logs -f api | grep "WebSocket"
```

### 3. Test WebSocket from Browser

Open browser console and run:

```javascript
// Replace with your domain and user ID
const ws = new WebSocket('wss://yourdomain.com/api/v1/cv-processing/ws/YOUR_USER_ID');

ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.onerror = (e) => console.error('Error:', e);
ws.onclose = (e) => console.log('Closed:', e.code, e.reason);

// Send ping
ws.send('ping');
```

**Expected Output**:
```
Connected
Message: {"type": "pong"}
```

### 4. Monitor Network Tab

1. Open browser DevTools
2. Go to **Network** tab
3. Filter by **WS** (WebSocket)
4. Upload CVs and start processing
5. You should see WebSocket connection with status **101 Switching Protocols**

---

## Common Issues and Fixes

### Issue 1: WebSocket Closes After 100 Seconds

**Cause**: Cloudflare free plan timeout

**Fix**:
- Implement heartbeat (already done in backend)
- Use reconnecting WebSocket (already provided)
- Consider upgrading Cloudflare plan for longer timeouts

### Issue 2: Connection Fails with SSL Error

**Cause**: Using `ws://` instead of `wss://` with HTTPS

**Fix**:
- Frontend should auto-detect protocol (implemented in `websocket.ts`)
- Ensure Cloudflare SSL is set to **Full** or **Full (strict)**

### Issue 3: Nginx Returns 400 Bad Request

**Cause**: Missing `Connection: upgrade` header mapping

**Fix**:
- Add the `map $http_upgrade $connection_upgrade` to `nginx.conf`
- Reload Nginx: `sudo systemctl reload nginx`

### Issue 4: Changes Appear Only After Refresh

**Cause**: WebSocket not connected, falling back to polling

**Fix**:
- Check browser console for WebSocket errors
- Verify Nginx WebSocket headers
- Check Cloudflare WebSocket is enabled
- Use reconnecting WebSocket utility

---

## Performance Optimization

### Cloudflare Settings

1. **Enable Argo Smart Routing** (Paid): Faster WebSocket routing
2. **Enable HTTP/3 (QUIC)**: Better performance for WebSocket
3. **Disable Brotli** for WebSocket endpoints: Can interfere with streaming

### Nginx Tuning

```nginx
# In nginx.conf http {} block
keepalive_timeout 7200s;
client_body_timeout 7200s;
client_header_timeout 7200s;

# Worker connections
events {
    worker_connections 4096;
}
```

---

## Monitoring and Debugging

### 1. Enable WebSocket Logging

**Backend** (`app/api/v1/cv_processing.py`):

```python
logger.info(f"WebSocket connected for user {user_id}")
logger.info(f"Subscribed to Redis channel: {channel}")
logger.debug(f"Forwarded {event.get('type')} event to WebSocket")
```

**Frontend**:

```javascript
console.log('[WebSocket] Connected');
console.log('[WebSocket] Message received:', data);
```

### 2. Monitor Redis Pub/Sub

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Subscribe to user events
SUBSCRIBE user:YOUR_USER_ID:events

# You should see events as CVs process
```

### 3. Check Cloudflare Analytics

1. Cloudflare Dashboard > **Analytics**
2. Check **WebSocket** requests
3. Monitor connection errors

---

## Deployment Checklist

- [ ] Cloudflare WebSockets enabled
- [ ] Cloudflare SSL set to Full/Full (strict)
- [ ] Nginx `map $http_upgrade $connection_upgrade` added
- [ ] Nginx WebSocket location configured
- [ ] Nginx timeouts increased (300s minimum)
- [ ] Backend heartbeat enabled (already done)
- [ ] Frontend uses reconnecting WebSocket
- [ ] Frontend uses `wss://` for HTTPS sites
- [ ] Test WebSocket from browser console
- [ ] Monitor logs for WebSocket connections
- [ ] Verify Redis pub/sub events

---

## Quick Fix (TL;DR)

1. **Edit `/etc/nginx/nginx.conf`** - Add in `http {}` block:
   ```nginx
   map $http_upgrade $connection_upgrade {
       default upgrade;
       '' close;
   }
   ```

2. **Update your Nginx site config** - Add timeouts and WebSocket headers (see full config above)

3. **Reload Nginx**:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. **Enable WebSocket in Cloudflare Dashboard** (Network tab)

5. **Update Frontend** - Use the reconnecting WebSocket utility from `frontend/utils/websocket.ts`

6. **Test** - Upload CVs and watch browser console for WebSocket messages

---

## Support

If issues persist:

1. Check browser console for WebSocket errors
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Check backend logs: `docker-compose logs -f api | grep WebSocket`
4. Test WebSocket directly from browser console (see Verification Steps)
5. Verify Cloudflare WebSocket is enabled
6. Check Redis is publishing events: `docker-compose exec redis redis-cli MONITOR`

---

**Last Updated**: 2025-12-06
**Applies To**: Production with Cloudflare SSL + Nginx + FastAPI
