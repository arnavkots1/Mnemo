# Quick Start Guide - Mnemo Expo

## Initial Setup (Windows)

### 1. Install Prerequisites

```bash
# Install Node.js (if not already installed)
# Download from: https://nodejs.org/

# Verify installation
node --version
npm --version
```

### 2. Install Expo CLI

```bash
npm install -g expo-cli
# Or use npx (no global install needed)
```

### 3. Navigate to Project

```bash
cd expo-mnemo
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Open Expo DevTools in your browser
- Display a QR code for Expo Go

## Running on Your Phone (Expo Go)

### iOS (iPhone)

1. Install **Expo Go** from the App Store
2. Open Expo Go app
3. Scan the QR code from terminal/browser
4. App will load on your phone

### Android

1. Install **Expo Go** from Google Play Store
2. Open Expo Go app
3. Scan the QR code from terminal/browser
4. App will load on your phone

## Running on Simulator/Emulator

### iOS Simulator (macOS only)

```bash
npm start
# Then press 'i' in the terminal
```

### Android Emulator

1. Start Android Studio and launch an emulator
2. Run:
```bash
npm start
# Then press 'a' in the terminal
```

## First Run Checklist

1. ✅ App loads without errors
2. ✅ Grant location permission when prompted
3. ✅ Today screen shows empty state
4. ✅ Settings screen shows all toggles
5. ✅ Can toggle "Enable Passive Context Logging"
6. ✅ Can start an Emotional Capture Session
7. ✅ Can import photos from Moments screen

## Testing Features

### Test Location Tracking

1. Go to Settings → Enable "Passive Context Logging"
2. Grant location permission
3. Move around (or simulate location in simulator)
4. Check Today screen for context entries

### Test Emotional Capture

1. Go to Today screen
2. Tap "Start Emotional Capture Session"
3. Grant microphone permission
4. Speak into microphone
5. Wait for emotion detection (stubbed - returns random emotions)
6. Tap "Stop" when done

### Test Photo Import

1. Go to Moments screen
2. Tap "Add Photos"
3. Select photos from your library
4. Photos appear as memory entries

## Troubleshooting

### "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

### Expo Go connection issues

- Ensure phone and computer are on same WiFi network
- Try using tunnel mode: `expo start --tunnel`
- Check firewall settings

### Permission errors

- Go to device Settings → Apps → Expo Go → Permissions
- Manually grant Location, Microphone, Photos

### TypeScript errors

```bash
# Check TypeScript version
npx tsc --version

# Should be 5.3.0 or compatible
```

## Project Structure Overview

```
expo-mnemo/
├── App.tsx                    # Entry point
├── types/                     # TypeScript types
├── store/                     # Data persistence
├── services/                  # Business logic
├── screens/                   # UI screens
└── components/                # Reusable components
```

## Next Steps

1. Test all features
2. Customize emotion detection (currently stubbed)
3. Add activity detection (currently placeholder)
4. Enhance UI/UX as needed
5. Consider SQLite migration for better performance

## Development Tips

- Use React DevTools for debugging
- Check Expo DevTools for logs
- Use `console.log()` for debugging (visible in Expo DevTools)
- Hot reload is enabled by default

## Building for Production

When ready to build standalone apps:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure build
eas build:configure

# Build
eas build --platform ios
eas build --platform android
```

