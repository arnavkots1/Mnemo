# Mnemo - Expo/React Native Project Context

## Product Overview

Mnemo is a personal memory timeline app with three core features:

1. **Passive Context Logging**: Background location tracking with optional activity classification
2. **Emotional Capture Sessions**: Foreground-only audio recording sessions with emotion detection
3. **Photo Moments**: User-selected photos turned into memory entries

## Platform & Stack

- **Framework**: Expo (managed) with TypeScript
- **Compatibility**: Expo Go (no custom native modules in v1)
- **Target**: Android and iOS (primarily tested via Expo Go)

## Key Libraries

- `expo-location` - Location tracking and background tasks
- `expo-task-manager` - Background location tasks
- `expo-sensors` - Activity hints (optional)
- `expo-av` - Audio recording in emotional sessions
- `expo-image-picker` - Photo selection
- `@react-navigation/native` + `@react-navigation/bottom-tabs` - Navigation
- `@react-native-async-storage/async-storage` - Persistence (can swap to SQLite later)

## Constraints & Limitations

### Background Limitations
- Passive context logging via `expo-location` with battery-friendly config
- **NO continuous background mic recording** - Emotional sessions are foreground-only
- Must work within Expo Go limitations (no custom native code)

### Platform Compatibility
- Designed for both Android and iOS
- Primary testing via Expo Go
- Respects OS permission models

## Data Model

### MemoryKind
```typescript
type MemoryKind = "context" | "emotional" | "photo"
```

### ActivityType
```typescript
type ActivityType = "stationary" | "walking" | "running" | "driving" | "unknown"
```

### MemoryEntry
```typescript
interface MemoryEntry {
  id: string                    // UUID
  kind: MemoryKind
  startTime: string            // ISO date string
  endTime?: string
  latitude?: number
  longitude?: number
  placeName?: string
  activityType?: ActivityType
  summary: string
  details?: Record<string, any>  // transcript, emotion label, etc.
}
```

## Screens

### Today Screen
- Timeline of all MemoryEntrys for "today"
- Button to start Emotional Capture Session
- Grouped by time periods

### Moments Screen
- Shows only emotional + photo memories
- Reverse chronological order
- Photo memories: thumbnail display
- Emotional memories: summary + emotion label

### Settings Screen
- Toggles:
  - Enable Passive Context Logging
  - Use Activity Detection
  - Allow Audio-based Emotional Capture
  - Auto-delete raw audio
- "Delete all data" button

## Emotion Detection (v1)

**No Core ML** - Using JavaScript-based approach:

- Stubbed classifier in JS:
  - Random emotion assignment for testing, OR
  - Simple rules on volume/pitch/loudness, OR
  - Placeholder API call to backend
- Architecture must allow easy swap to API-based model later

## Persistence

- **Start**: AsyncStorage (single key: "mnemo_memories")
- **Abstract**: MemoryStore module for easy swap to SQLite
- Store array of MemoryEntry objects

## Architecture Principles

- Functional components + React hooks
- Modular structure: `services/`, `screens/`, `components/`, `store/`, `types/`
- TypeScript with strict types
- Respect Expo + OS constraints
- Battery-friendly background tasks
- Privacy-first design

