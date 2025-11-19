# Emotional Capture Session Implementation

## Overview

The Emotional Capture Session feature allows users to capture emotional moments (like laughter) in real-time using foreground audio capture and speech recognition.

## UI Components

### TodayView Integration

- **Prominent Button**: Added a prominent "Start Emotional Capture" button at the top of TodayView
- **Full-Screen Modal**: Tapping the button presents `EmotionalSessionView` modally

### EmotionalSessionView

**Features**:
- **Large Pulsing Mic Icon**: 120pt SF Symbol that pulses when active
- **Instruction Text**: "Listening for laughs & emotional moments. Please keep this screen open."
- **Timer**: Shows session duration in MM:SS or HH:MM:SS format
- **End Session Button**: Clear red button in header to stop and dismiss
- **Toast Notifications**: Brief snackbar-style notifications when moments are captured
- **Event Counter**: Shows count of detected moments

**Design**:
- Full-screen modal presentation
- Clean, focused interface
- Real-time feedback via animations and toast messages

## Service: EmotionalCaptureService

### Core Functionality

**Audio Capture**:
- Uses `AVAudioEngine` for real-time audio capture
- Buffers audio into 1-second frames
- Maintains circular buffer of last 10 seconds (for 3s before capture)

**Simulated Emotion Detection**:
- Randomly triggers "laugh detected" events every 30-90 seconds
- Uses timer-based simulation (will be replaced with Core ML model)

**When Event Triggered**:
1. Captures audio context window (3 seconds before + 7 seconds after)
2. Runs speech recognition on captured audio using `SFSpeechRecognizer`
3. Creates `.emotional` MemoryEntry with:
   - `startTime` / `endTime` for the event
   - Current latitude/longitude (if available)
   - Summary: "You laughed when you said: [transcript]" or "Captured emotional moment: [emotion]"
   - Details including transcript, emotion type, confidence

**Audio File Management**:
- Configurable `keepRawAudio` property (default: `false`)
- If `keepRawAudio = false`: Only transcript is stored, audio is discarded
- If `keepRawAudio = true`: Audio file saved to temporary directory (placeholder implementation)

### Permissions

Requests two permissions:
1. **Microphone** (`AVAudioSession.requestRecordPermission`)
2. **Speech Recognition** (`SFSpeechRecognizer.requestAuthorization`)

### Future Core ML Integration

**Emotion Enum**:
```swift
enum Emotion: String, Codable {
    case happy
    case sad
    case angry
    case surprised
    case neutral
}
```

**Classification Stub**:
```swift
func classifyEmotion(from buffer: AVAudioPCMBuffer, at time: AVAudioTime) -> Emotion?
```

Currently returns random emotion for simulation. In production, this will:
- Take audio buffer as input
- Run Core ML model inference
- Return detected emotion type
- Replace the random trigger logic

## Integration Flow

1. **User taps "Start Emotional Capture"** in TodayView
2. **EmotionalSessionView presented** modally
3. **Service starts**:
   - Requests permissions (if needed)
   - Configures AVAudioEngine
   - Starts audio capture
   - Schedules first simulated detection
4. **During session**:
   - Audio buffered in 1-second frames
   - Timer counts down to next detection (30-90s)
   - When triggered: captures context, runs speech recognition, creates MemoryEntry
5. **Toast notification** appears when moment captured
6. **User taps "End Session"**:
   - Stops audio engine
   - Cleans up resources
   - Dismisses view

## MemoryEntry Structure

```swift
MemoryEntry(
    kind: .emotional,
    startTime: event.timestamp,
    endTime: event.timestamp.addingTimeInterval(10), // 10-second window
    latitude: event.location?.coordinate.latitude,
    longitude: event.location?.coordinate.longitude,
    activityType: .stationary,
    summary: "You laughed when you said: [transcript]",
    details: [
        "emotionType": "happy",
        "confidence": 0.8,
        "transcript": "...",
        "audioURL": nil // if keepRawAudio = false
    ]
)
```

## Configuration

### Audio Settings

- **Buffer Duration**: 1 second per frame
- **Max Buffer Size**: 10 seconds (for 3s before capture)
- **Context Window**: 3 seconds before + 7 seconds after trigger
- **Sample Rate**: Uses device's native audio format

### Detection Settings

- **Simulation Interval**: 30-90 seconds (random)
- **Speech Recognition Timeout**: 5 seconds
- **Toast Display Duration**: 3 seconds

## Testing Considerations

The service is designed for easy testing:
- Protocol-based (`EmotionalCaptureService`)
- Can mock for unit tests
- Simulated detection allows testing without real audio
- Configurable audio storage for testing different scenarios

## Future Enhancements

1. **Core ML Integration**:
   - Replace random trigger with real emotion detection
   - Implement `classifyEmotion` with actual model inference
   - Support multiple emotion types

2. **Audio File Handling**:
   - Proper audio file saving/loading
   - Compression and storage optimization
   - Auto-deletion after configurable retention period

3. **Location Integration**:
   - Connect to LocationService for current location
   - Enrich entries with place names

4. **UI Improvements**:
   - Visual feedback during audio capture
   - Waveform visualization
   - Better error handling and user feedback

5. **Settings**:
   - User-configurable detection sensitivity
   - Audio retention preferences
   - Permission management UI

