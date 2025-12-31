# Fix Backend Connection - 503/408 Errors

## The Problem
Localtunnel is **unreliable** and causes 503/408 errors. It's meant for quick testing, not production use.

## The Solution: Use Your Computer's IP Address

### Step 1: Find Your IP Address
Run this command:
```bash
ipconfig
```

Look for "IPv4 Address" under your Wi-Fi adapter. It will look like: `192.168.1.49`

### Step 2: Update expo-mnemo/.env
Open `expo-mnemo/.env` and change the URL to use your IP:

```
EXPO_PUBLIC_API_URL=http://192.168.1.49:3000/api
```
(Replace `192.168.1.49` with YOUR actual IP address from Step 1)

### Step 3: Restart Everything
1. Stop the Expo app (Ctrl+C)
2. Restart: `npm start` in expo-mnemo folder
3. The backend should already be running on `http://0.0.0.0:3000`

### Step 4: Verify
Check the logs when the app starts. You should see:
```
🌐 [API_CONFIG] BACKEND_API_URL: http://192.168.1.49:3000/api
```

## Why This Works Better

| Localtunnel (Current) | IP Address (Recommended) |
|----------------------|--------------------------|
| ❌ 503/408 errors | ✅ Reliable |
| ❌ Slow (tunneling overhead) | ✅ Fast (direct connection) |
| ❌ Requires internet | ✅ Works on local network |
| ❌ Random URLs | ✅ Consistent IP |

## Requirements
- Phone and computer must be on the **SAME Wi-Fi network**
- Backend must run on `0.0.0.0:3000` (not `localhost`) ✅ Already configured
- Firewall must allow port 3000 (usually automatic on Windows)

## If You MUST Use a Tunnel
Use **ngrok** instead (much more reliable than localtunnel):

1. Download: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update `.env`: `EXPO_PUBLIC_API_URL=https://abc123.ngrok.io/api`

## Current Configuration
- Backend tunnel: `https://ordinary-wolverine-35.loca.lt` (UNRELIABLE)
- Recommended: Use IP address `http://192.168.1.49:3000/api` (RELIABLE)

