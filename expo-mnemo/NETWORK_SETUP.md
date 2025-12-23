# Network Setup Guide

## Why Not Localhost?

**The short answer:** It depends on how you're running the app!

### Expo Go on Physical Device (Phone)
- **Problem**: Your phone is a **separate device** from your computer
- **Solution**: Must use your computer's **IP address** (e.g., `http://172.20.10.6:3000/api`)
- **Why**: "localhost" on your phone refers to the phone itself, not your computer

### Android/iOS Emulator/Simulator
- **Works**: Can use `localhost` or `127.0.0.1`
- **Android Emulator**: Use `http://10.0.2.2:3000/api` (special IP that maps to host)
- **iOS Simulator**: Use `http://localhost:3000/api`

### Tunnel Mode (ngrok-like)
- **Works**: Can use `localhost` because tunnel handles routing
- **Command**: `npm run start:tunnel`
- **Slower**: But works from anywhere (even different networks)

## Quick Setup

### Option 1: Physical Device (Current Setup)
```bash
# 1. Find your computer's IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# 2. Update apiConfig.ts with your IP
# Default is: 172.20.10.6

# 3. Make sure phone and computer are on same Wi-Fi
```

### Option 2: Use Emulator (Localhost Works!)
```bash
# 1. Start Android emulator or iOS simulator
npm run android  # or npm run ios

# 2. Set environment variable
# Windows PowerShell:
$env:EXPO_PUBLIC_API_URL="http://localhost:3000/api"

# Windows CMD:
set EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Mac/Linux:
export EXPO_PUBLIC_API_URL=http://localhost:3000/api

# 3. Start Expo
npm start
```

### Option 3: Tunnel Mode (Works Anywhere)
```bash
# 1. Start with tunnel
npm run start:tunnel

# 2. Expo will show you a tunnel URL
# 3. Set EXPO_PUBLIC_API_URL to that URL
# Example: https://abc123.ngrok-free.app
```

## Environment Variable Priority

The app checks in this order:
1. `EXPO_PUBLIC_API_URL` (if set, uses this)
2. Tunnel mode detection (uses localhost)
3. Default IP address (for physical device)

## Troubleshooting

### "Backend unreachable" on physical device
- ✅ Check phone and computer are on **same Wi-Fi network**
- ✅ Verify IP address is correct (`ipconfig` to check)
- ✅ Make sure backend is running (`npm run dev` in backend folder)
- ✅ Check Windows Firewall allows port 3000

### "Backend unreachable" on emulator
- ✅ Set `EXPO_PUBLIC_API_URL=http://localhost:3000/api`
- ✅ For Android: Try `http://10.0.2.2:3000/api`
- ✅ Make sure backend is running

### Want to switch between modes?
Just set/unset `EXPO_PUBLIC_API_URL`:
```bash
# Use localhost (emulator)
export EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Use IP (physical device)
unset EXPO_PUBLIC_API_URL  # or set to your IP

# Use tunnel
export EXPO_PUBLIC_API_URL=https://your-tunnel.ngrok-free.app/api
```

