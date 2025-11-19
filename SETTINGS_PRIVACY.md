# Settings & Privacy Implementation

## Overview

The Settings tab provides comprehensive privacy controls and allows users to configure how Mnemo collects and stores data.

## SettingsStore

### Architecture

**ObservableObject**: `SettingsStore` persists user preferences using `UserDefaults`

**Published Properties**:
- `isPassiveContextLoggingEnabled` (default: `true`)
- `useMotionActivity` (default: `true`)
- `useCalendarEvents` (default: `false`)
- `autoDeleteRawAudio` (default: `true`)
- `allowSpeechRecognition` (default: `true`)
- `audioRetentionMinutes` (default: `5`)

**Persistence**:
- Automatically saves to `UserDefaults` when any property changes
- Loads saved values on initialization
- Falls back to defaults if no saved value exists

## SettingsView Sections

### 1. Passive Context Logging

**Toggles**:
- **Enable Passive Context Logging**: Master toggle for all passive logging
  - Description: "Automatically log location visits and activities"
  - When OFF: Stops all location/motion/calendar services
  
- **Use Motion Activity**: Sub-toggle (only visible when passive logging is enabled)
  - Description: "Detect walking, running, or stationary activity"
  - When OFF: Motion service stops, activity type defaults to `.unknown`
  
- **Use Calendar Events**: Sub-toggle (only visible when passive logging is enabled)
  - Description: "Enrich memories with calendar event titles"
  - When OFF: Calendar service stops, no event enrichment

**Immediate Effect**:
- Toggles use Combine publishers to immediately update services
- `ContextLoggingCoordinator` observes settings changes
- Services start/stop in real-time based on toggle state

### 2. Emotional Capture

**Toggles**:
- **Auto-delete Raw Audio**: Controls audio file retention
  - Default: `ON` (true)
  - When ON: Audio files deleted after retention period
  - When OFF: Audio files kept (if `keepRawAudio` is implemented)
  
- **Retention Minutes**: Stepper (only visible when auto-delete is ON)
  - Range: 1-60 minutes
  - Default: 5 minutes
  
- **Allow Speech Recognition**: Controls transcript storage
  - Default: `ON` (true)
  - When ON: Transcripts stored in MemoryEntry details
  - When OFF: Only emotion type stored, no transcript

**Immediate Effect**:
- `EmotionalCaptureService` checks settings before processing events
- Speech recognition skipped if disabled
- Audio file saving respects `autoDeleteRawAudio` setting

### 3. Data & Privacy

**Privacy Model Summary**:
- Bullet points explaining privacy approach:
  - "All data stored locally by default"
  - "No secret recording; mic is only used during explicit Emotional Capture Sessions"
  - "Location tracking requires explicit permission and can be disabled anytime"
  - "You can delete all data at any time"

**Actions**:
- **Delete All Data**: 
  - Shows confirmation alert
  - Calls `MemoryStore.deleteAll()`
  - Clears all memories (context, emotional, photo)
  - TODO: Also deletes cached audio/transcript files

- **Review Permissions**:
  - Opens sheet with instructions
  - Provides button to open iOS Settings app
  - Guides user to permission settings

## Service Integration

### ContextLoggingCoordinator

**Settings Observers**:
```swift
settingsStore.$isPassiveContextLoggingEnabled
    .sink { enabled in
        if enabled { start() } else { stop() }
    }

settingsStore.$useMotionActivity
    .sink { enabled in
        if enabled { motionService.startMonitoring() }
        else { motionService.stopMonitoring() }
    }

settingsStore.$useCalendarEvents
    .sink { enabled in
        if enabled { calendarService.startMonitoring() }
        else { calendarService.stopMonitoring() }
    }
```

**Visit Handling**:
- Checks `useMotionActivity` before calling `dominantActivity()`
- Checks `useCalendarEvents` before enriching with calendar events
- Falls back to `.unknown` activity if motion disabled

### EmotionalCaptureService

**Settings Integration**:
- `settingsStore` injected as weak reference
- `keepRawAudio` computed property: `!autoDeleteRawAudio`
- Speech recognition only runs if `allowSpeechRecognition == true`

**Event Processing**:
```swift
// Speech recognition only if allowed
let transcript: String?
if settingsStore?.allowSpeechRecognition == true {
    transcript = await recognizeSpeech(from: buffer)
} else {
    transcript = nil
}

// Audio file only if keeping
if keepRawAudio {
    audioURL = await saveAudioBuffer(buffer)
}
```

## App Integration

### MnemoApp

**Initialization**:
```swift
@StateObject private var settingsStore = SettingsStore()

// Inject into environment
.environmentObject(settingsStore)

// Pass to coordinator
ContextLoggingCoordinator(
    ...,
    settingsStore: settingsStore
)
```

**Startup Behavior**:
- Checks `isPassiveContextLoggingEnabled` before starting coordinator
- Respects user's last saved preference

## User Experience

### Immediate Feedback

- **Toggles**: Changes take effect immediately via Combine publishers
- **No Restart Required**: Services start/stop in real-time
- **Visual Feedback**: Toggles update UI immediately

### Privacy Transparency

- **Clear Explanations**: Each toggle has inline description
- **Privacy Model**: Explicitly stated in Data & Privacy section
- **Easy Control**: One-tap to disable any feature
- **Data Deletion**: Simple, clear process with confirmation

## Future Enhancements

1. **Audio File Cleanup**:
   - Implement actual file deletion for cached audio
   - Respect retention period setting
   - Cleanup on app launch/background

2. **Export Data**:
   - Allow users to export their memories
   - JSON/CSV format options

3. **Granular Controls**:
   - Per-service enable/disable
   - Time-based logging (e.g., only during certain hours)
   - Location-based logging (e.g., exclude home)

4. **Privacy Dashboard**:
   - Show what data is stored
   - Storage usage statistics
   - Last activity timestamps

5. **Settings Sync**:
   - iCloud sync for settings (not data)
   - Cross-device preferences

