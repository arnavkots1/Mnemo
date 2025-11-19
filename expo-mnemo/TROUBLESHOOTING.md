# Troubleshooting Guide - Expo Connection Issues

## Common Issue: "Unable to connect to development server"

This usually happens when your phone can't reach your computer over the network.

## Solution 1: Use Tunnel Mode (Recommended for Windows)

Tunnel mode routes the connection through Expo's servers, bypassing local network issues:

```bash
# Stop the current server (Ctrl+C)
# Then restart with tunnel mode:
expo start --tunnel
```

**Note**: Tunnel mode requires an Expo account (free). You'll be prompted to sign in.

## Solution 2: Check Network Connection

1. **Ensure same WiFi network:**
   - Phone and computer must be on the same WiFi
   - Some corporate/public networks block device-to-device communication

2. **Check Windows Firewall:**
   - Windows Defender Firewall may be blocking Node.js
   - Go to: Windows Security → Firewall & network protection
   - Allow Node.js through firewall if prompted

3. **Try manual IP connection:**
   - Find your computer's IP address:
     ```bash
     ipconfig
     # Look for IPv4 Address (e.g., 192.168.1.100)
     ```
   - In Expo Go, tap "Enter URL manually"
   - Enter: `exp://YOUR_IP:8081` (replace YOUR_IP with your actual IP)

## Solution 3: Use USB Connection (Android)

For Android devices, you can use USB debugging:

1. Enable USB debugging on your Android phone
2. Connect via USB
3. Run:
   ```bash
   expo start --android
   ```

## Solution 4: Update Package Versions

Expo is warning about package version mismatches. Update them:

```bash
# Update to compatible versions
npx expo install expo-image-picker expo-task-manager react-native react-native-safe-area-context @react-native-async-storage/async-storage typescript
```

## Solution 5: Clear Expo Cache

Sometimes cache issues cause connection problems:

```bash
# Clear Metro bundler cache
expo start --clear

# Or clear all Expo cache
npx expo start -c
```

## Quick Fix Checklist

- [ ] Try tunnel mode: `expo start --tunnel`
- [ ] Ensure phone and computer on same WiFi
- [ ] Check Windows Firewall settings
- [ ] Try manual IP connection in Expo Go
- [ ] Update package versions
- [ ] Clear cache and restart

## Still Not Working?

1. **Check Expo Go version:**
   - Update Expo Go app to latest version
   - App Store (iOS) or Play Store (Android)

2. **Try different network:**
   - Switch to mobile hotspot
   - Or try a different WiFi network

3. **Check Expo status:**
   - Visit: https://status.expo.dev
   - Ensure Expo services are operational

4. **Alternative: Use Web Preview:**
   ```bash
   # Press 'w' in the Expo terminal
   # Or run: expo start --web
   ```
   Note: Some features (location, camera) won't work in web preview

