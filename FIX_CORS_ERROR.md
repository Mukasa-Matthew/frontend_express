# Fix: CORS Error - Cannot Fetch from localhost

## Problem

You're seeing this error:
```
Access to fetch at 'http://localhost:5000/api/auth/login' from origin 'http://64.23.169.136:3000' 
has been blocked by CORS policy: The request client is not a secure context and the resource 
is in more-private address space `loopback`.
```

## Root Cause

Your frontend is hosted on `http://64.23.169.136:3000` (public IP), but it's trying to connect to `http://localhost:5000` (local address). Modern browsers block requests from public origins to localhost for security reasons.

## Solution

You need to update the frontend's API URL to use the public IP address instead of localhost.

### Step 1: Update .env File on Your Server

SSH into your server and navigate to the frontend directory:

```bash
cd /path/to/frontend_express
```

Edit or create the `.env` file:

```bash
nano .env
```

Make sure it contains:

```env
VITE_API_URL=http://64.23.169.136:5000
```

**Important:** Make sure there are NO trailing commas, spaces, or multiple URLs. It should be exactly:
```
VITE_API_URL=http://64.23.169.136:5000
```

### Step 2: Rebuild the Frontend

Since Vite embeds environment variables at build time, you MUST rebuild:

```bash
npm run build
```

### Step 3: Restart Your Frontend Server

If you're using PM2:

```bash
pm2 restart frontend
# OR
pm2 restart all
```

If you're using a different method, restart your frontend server.

### Step 4: Verify

1. Open your browser's developer console (F12)
2. Go to the Network tab
3. Try to log in
4. Check that the API requests are now going to `http://64.23.169.136:5000` instead of `http://localhost:5000`

## Quick Fix Script (Linux/Mac)

On your server, run:

```bash
cd frontend_express
chmod +x fix-api-url.sh
./fix-api-url.sh
npm run build
pm2 restart frontend  # or restart your frontend server
```

## Quick Fix Script (Windows PowerShell)

On your Windows machine (if you're building locally):

```powershell
cd frontend_express
.\fix-env.ps1
npm run build
```

Then upload the new `dist` folder to your server.

## Verification Checklist

- [ ] `.env` file contains `VITE_API_URL=http://64.23.169.136:5000` (no localhost)
- [ ] Frontend has been rebuilt (`npm run build`)
- [ ] Frontend server has been restarted
- [ ] Browser console shows API requests going to `http://64.23.169.136:5000`
- [ ] No CORS errors in browser console

## Additional Notes

### About the Other Errors

The errors like:
- `Error: Attempting to use a disconnected port object`
- `Error: Called encrypt() without a session key`

These are from browser extensions (likely a password manager or similar). They don't affect your application and can be ignored.

### Why This Happens

Vite embeds environment variables during the build process. If your `.env` file says `localhost:5000`, that's what gets baked into the JavaScript bundle. Even if you update the `.env` file later, you must rebuild for the changes to take effect.

### Backend CORS Configuration

Make sure your backend's CORS configuration allows requests from `http://64.23.169.136:3000`. Check your backend's `.env` file:

```env
FRONTEND_URLS=http://64.23.169.136:3000
# OR
FRONTEND_URL=http://64.23.169.136:3000
```

## Still Having Issues?

1. **Clear browser cache** - Old JavaScript might still have the localhost URL
2. **Check the built files** - Look in `dist/assets/` and search for "localhost:5000" to verify it's been updated
3. **Check backend logs** - Make sure the backend is running and accessible at `http://64.23.169.136:5000`
4. **Test backend directly** - Try accessing `http://64.23.169.136:5000/api/health` in your browser

