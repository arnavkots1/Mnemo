# Mnemo Expo Architecture

## Overview

This document describes the architecture and data model for the Mnemo Expo/React Native application.

## Project Structure

```
expo-mnemo/
├── types/              # TypeScript type definitions
│   └── MemoryEntry.ts
├── store/             # Data persistence and state management
│   ├── MemoryStore.ts      # AsyncStorage-based persistence
│   └── MemoryContext.tsx   # React Context for global state
├── services/          # Business logic services
│   ├── LocationService.ts
│   ├── EmotionalCaptureService.ts
│   ├── EmotionClassifier.ts
│   ├── PhotoImportService.ts
│   └── ContextLoggingService.ts
├── screens/           # Screen components
│   ├── TodayScreen.tsx
│   ├── MomentsScreen.tsx
│   └── SettingsScreen.tsx
└── components/        # Reusable UI components
    └── MemoryCard.tsx
```

## Data Model

### MemoryKind
```typescript
export type MemoryKind = 'context' | 'emotional' | 'photo'
```

### ActivityType
```typescript
export type ActivityType = 'stationary' | 'walking' | 'running' | 'driving' | 'unknown'
```

### MemoryEntry
```typescript
export interface MemoryEntry {
  id: string                    // UUID
  kind: MemoryKind
  startTime: string             // ISO date string
  endTime?: string
  latitude?: number
  longitude?: number
  placeName?: string
  activityType?: ActivityType
  summary: string
  details?: Record<string, any>  // transcript, emotion label, photo URI, etc.
}
```

## Persistence Layer

### MemoryStore (store/MemoryStore.ts)

Uses AsyncStorage to persist MemoryEntry objects with:
- In-memory cache to avoid frequent AsyncStorage reads
- CRUD operations for memories
- Query methods (by day, by kind, recent moments)

**Key Methods:**
- `loadMemories(): Promise<MemoryEntry[]>`
- `saveMemories(memories: MemoryEntry[]): Promise<void>`
- `addMemory(memory: MemoryEntry): Promise<void>`
- `updateMemory(memory: MemoryEntry): Promise<void>`
- `getMemoriesForDay(date: Date): Promise<MemoryEntry[]>`
- `getRecentMoments(limit: number): Promise<MemoryEntry[]>`
- `deleteAllMemories(): Promise<void>`

### MemoryContext (store/MemoryContext.tsx)

React Context provider that:
- Loads memories on app start
- Exposes `memories` state and `setMemories` updater
- Provides convenience methods (add/update/delete)
- Notifies subscribers of changes
- Syncs with MemoryStore automatically

## Service Layer

Services handle business logic and interact with native APIs:

- **LocationService**: Location tracking and geocoding
- **EmotionalCaptureService**: Audio recording and emotion detection
- **EmotionClassifier**: Emotion classification (stubbed for v1)
- **PhotoImportService**: Photo selection and import
- **ContextLoggingService**: Orchestrates passive context logging

## State Management Flow

```
App Start
  ↓
MemoryContext loads memories from MemoryStore
  ↓
Screens subscribe to MemoryContext
  ↓
User actions → Services → MemoryStore → MemoryContext → UI updates
```

## Design Principles

1. **Separation of Concerns**: Types, store, services, and UI are separated
2. **Single Source of Truth**: MemoryStore is the authoritative data source
3. **Reactive Updates**: MemoryContext propagates changes to subscribers
4. **Performance**: In-memory cache reduces AsyncStorage I/O
5. **Type Safety**: Full TypeScript coverage with strict types

## Future Enhancements

- Migrate to SQLite for better performance with large datasets
- Add pagination for memory lists
- Implement search/filter functionality
- Add data export/import
- Cloud sync (optional, privacy-first)

