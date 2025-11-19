# Mnemo - Expo/React Native Version

A personal memory timeline app built with React Native and Expo.

## Features

- **Passive Context Logging**: Background location tracking with optional activity detection
- **Emotional Capture Sessions**: Foreground-only audio recording with emotion detection
- **Photo Moments**: Import photos to create memory entries with location context

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo Go app installed on your iOS/Android device (for testing)
- Or Expo CLI for development builds

## Setup

1. **Install dependencies:**
   ```bash
   cd expo-mnemo
   npm install
   ```

2. **Start the Expo development server:**
   ```bash
   npm start
   ```

3. **Run on device:**
   - Open Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## Project Structure

```
expo-mnemo/
├── App.tsx                 # Main app component with navigation
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
├── types/                 # TypeScript type definitions
│   └── MemoryEntry.ts
├── store/                 # Data persistence layer
│   ├── MemoryStore.ts
│   └── SettingsStore.ts
├── services/              # Business logic services
│   ├── LocationService.ts
│   ├── EmotionalCaptureService.ts
│   ├── EmotionClassifier.ts
│   ├── PhotoImportService.ts
│   └── ContextLoggingService.ts
├── screens/               # Screen components
│   ├── TodayScreen.tsx
│   ├── MomentsScreen.tsx
│   └── SettingsScreen.tsx
└── components/            # Reusable UI components
    └── MemoryCard.tsx
```

## Key Libraries

- `expo-location` - Location tracking
- `expo-av` - Audio recording
- `expo-image-picker` - Photo selection
- `@react-navigation/native` - Navigation
- `@react-native-async-storage/async-storage` - Local storage

## Permissions

The app requires the following permissions:

- **Location**: For passive context logging
- **Microphone**: For emotional capture sessions (foreground only)
- **Photo Library**: For importing photos

All permissions are requested explicitly when needed, and all data is stored locally on your device.

## Development Notes

### Emotion Detection (v1)

Currently uses a stubbed classifier that returns random emotions for testing. The architecture allows easy swap to:
- Rule-based audio analysis
- API-based classification
- On-device ML model (if Expo supports it)

### Background Limitations

- Passive context logging uses `expo-location` with battery-friendly settings
- **No background mic recording** - Emotional sessions are foreground-only
- All processing happens on-device

### Data Storage

- Uses AsyncStorage for simplicity (can be swapped with SQLite later)
- All data stored locally - no cloud sync
- Settings persist across app restarts

## Testing

1. **Location Tracking**: Enable in Settings, then move around to see context entries
2. **Emotional Capture**: Tap "Start Emotional Capture Session" on Today screen
3. **Photo Import**: Tap "Add Photos" on Moments screen
4. **Settings**: Toggle features on/off, test "Delete All Data"

## Building for Production

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

Or use EAS Build:
```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## License

Private project - All rights reserved

