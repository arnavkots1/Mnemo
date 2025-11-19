# Mnemo

A personal AI memory app for iOS that builds a private timeline of your life.

## Features

- **Passive Context Logging**: Automatically logs location, motion activity, and calendar events (with user consent)
- **Emotional Capture Sessions**: Foreground-only audio sessions that detect emotional moments
- **Photo Moments**: User-selected photos turned into contextual memories

## Project Structure

```
Mnemo/
├── App/
│   ├── MnemoApp.swift          # Main app entry point
│   └── AppState.swift          # Central state manager
├── Models/
│   └── MemoryEntry.swift       # Core data models
├── Services/
│   ├── MemoryStore.swift       # Persistence layer
│   ├── LocationService.swift   # Location tracking
│   ├── MotionService.swift     # Motion activity
│   ├── CalendarService.swift   # Calendar events
│   ├── EmotionalCaptureService.swift  # Audio/emotion detection
│   └── PhotoImportService.swift       # Photo import
└── Views/
    ├── MainTabView.swift       # Tab navigation
    ├── TodayView.swift         # Today's timeline
    ├── MomentsView.swift       # Emotional/photo moments
    ├── SettingsView.swift      # Settings & privacy
    ├── EmotionalCaptureView.swift  # Capture session UI
    └── PhotoPickerView.swift   # Photo selection
```

## Required Info.plist Entries

Add these keys to your `Info.plist`:

```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Mnemo needs location access to log where you were and create contextual memories.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Mnemo needs location access to log where you were and create contextual memories.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>Mnemo needs location access to log where you were and create contextual memories.</string>

<key>NSMicrophoneUsageDescription</key>
<string>Mnemo needs microphone access only during Emotional Capture Sessions to detect emotional moments. These sessions are explicit and foreground-only.</string>

<key>NSSpeechRecognitionUsageDescription</key>
<string>Mnemo needs speech recognition to transcribe audio during Emotional Capture Sessions.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Mnemo needs photo library access to import photos you select as moments.</string>

<key>NSCalendarsUsageDescription</key>
<string>Mnemo can optionally log calendar events to enrich your memory timeline.</string>

<key>NSMotionUsageDescription</key>
<string>Mnemo uses motion activity to understand what you were doing (walking, stationary, etc.)</string>
```

## Setup Instructions

1. Create a new iOS app project in Xcode
2. Copy all Swift files to your project maintaining the folder structure
3. Add the required Info.plist entries above
4. Ensure your deployment target is iOS 16.0+ (for PhotosPicker)
5. Build and run

## Architecture

- **Protocol-based Services**: All services use protocols for easy testing and mocking
- **Dependency Injection**: Services are injected into AppState
- **Combine Publishers**: Reactive updates for location, motion, and events
- **File-based Storage**: Simple JSON persistence (can be upgraded to Core Data later)

## Next Steps

- [ ] Integrate Core ML model for emotion detection
- [ ] Add reverse geocoding for place names
- [ ] Implement audio file storage and auto-deletion
- [ ] Add vision model for photo captioning
- [ ] Migrate to Core Data for better performance
- [ ] Add share extension for photo import
- [ ] Implement onboarding flow

## Privacy

Mnemo is designed with privacy in mind:
- All data is stored locally
- No background microphone usage
- Explicit user consent for all features
- Easy data deletion
- No silent photo scanning

