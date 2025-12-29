# Tunnel Setup Guide

This guide explains how to use a tunnel to access your backend from anywhere without configuring IP addresses.

## Why Use a Tunnel?

- ✅ **No IP configuration needed** - Works on any network
- ✅ **Works from anywhere** - Phone, emulator, or physical device
- ✅ **No firewall changes** - Tunnel handles everything
- ✅ **Consistent URL** - Same URL every time (if you set a subdomain)

## Quick Start

### Option 1: Use Tunnel Mode (Recommended)

1. **Start backend with tunnel:**
   ```bash
   npm run dev:tunnel
   ```

2. **Copy the tunnel URL** from the console output (looks like `https://xxxxx.loca.lt`)

3. **Set the tunnel URL in your Expo app:**
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   # In expo-mnemo directory
   export EXPO_PUBLIC_API_URL=https://xxxxx.loca.lt/api
   # Or on Windows PowerShell:
   $env:EXPO_PUBLIC_API_URL="https://xxxxx.loca.lt/api"
   ```
   
   **Option B: Update apiConfig.ts**
   ```typescript
   const BACKEND_API_URL = 'https://xxxxx.loca.lt/api';
   ```

4. **Restart your Expo app** - It will now use the tunnel URL!

### Option 2: Consistent Subdomain (Optional)

If you want the same URL every time:

1. **Set a subdomain in .env:**
   ```env
   USE_TUNNEL=true
   TUNNEL_SUBDOMAIN=mnemo-backend
   ```

2. **Start backend:**
   ```bash
   npm run dev:tunnel
   ```

3. **Your tunnel URL will be:** `https://mnemo-backend.loca.lt`

## How It Works

- **localtunnel** creates a public URL that forwards to your local backend
- The tunnel URL is accessible from anywhere (phone, emulator, etc.)
- No need to configure IP addresses or firewall rules
- The tunnel stays active as long as your backend is running

## Troubleshooting

### Tunnel URL changes every time
- Set `TUNNEL_SUBDOMAIN` in `.env` for a consistent URL
- Note: Subdomains may not always be available (first come, first served)

### Tunnel connection fails
- Check your internet connection
- Try a different subdomain
- The tunnel service might be temporarily unavailable

### App can't connect to tunnel
- Make sure you set `EXPO_PUBLIC_API_URL` correctly
- Restart your Expo app after setting the URL
- Check that the tunnel URL includes `/api` at the end

## Switching Back to IP Mode

If you want to use IP addresses instead:

1. **Start backend normally:**
   ```bash
   npm run dev
   ```

2. **Update apiConfig.ts** with your current IP address

3. **Restart your Expo app**

## Notes

- Tunnel URLs are free and don't require signup
- Tunnel URLs are public (anyone with the URL can access your backend)
- For production, use a proper hosting service with authentication
- Tunnel URLs may be slower than direct IP connections

