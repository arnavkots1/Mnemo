# Mnemo App Structure

## Overview

The app uses a clean SwiftUI architecture with environment-based dependency injection.

## App Entry Point

**`MnemoApp.swift`**
- Creates a single `InMemoryMemoryStore` instance
- Injects it into the SwiftUI environment via `@StateObject` and `.environmentObject()`
- Launches `RootView` as the main interface

## Root View

**`RootView` (MainTabView.swift)**
- Contains a `TabView` with three tabs:
  1. **Today** - Timeline view
  2. **Moments** - Emotional/photo memories
  3. **Settings** - Privacy controls

## TodayView

**Requirements Met:**
- ✅ Groups `MemoryEntry` objects by time (hour blocks)
- ✅ Shows time range (start - end, or just start if no end)
- ✅ Displays `placeName` if available
- ✅ Shows `summary`
- ✅ Displays `activityType` as a badge

**Structure:**
- Uses `memoryStore.memories(forDay:)` to get today's memories
- Groups memories by hour using `Dictionary(grouping:)`
- Displays in vertical list with time group headers
- Observes `memoryStore.memories` for reactive updates

## MomentsView

**Requirements Met:**
- ✅ Filters `MemoryEntry` where `kind == .emotional` or `kind == .photo`
- ✅ Shows in reverse chronological order (most recent first)
- ✅ Displays summary, date, and place name

**Structure:**
- Filters all memories for emotional/photo types
- Sorts by `startTime` descending
- Shows in a vertical list with cards

## SettingsView

**Requirements Met:**
- ✅ Stubbed with placeholders
- ✅ Ready for future implementation

**Structure:**
- Simple Form with placeholder sections
- Will be filled in later with privacy controls

## Environment Injection Pattern

All views access the `MemoryStore` via:
```swift
@EnvironmentObject var memoryStore: InMemoryMemoryStore
```

This ensures:
- Single source of truth
- Reactive updates via `@Published` property
- Clean dependency injection
- Easy testing (can swap implementations)

## Data Flow

```
MnemoApp
  └── @StateObject memoryStore: InMemoryMemoryStore
       └── .environmentObject(memoryStore)
            └── RootView
                 ├── TodayView (@EnvironmentObject memoryStore)
                 ├── MomentsView (@EnvironmentObject memoryStore)
                 └── SettingsView (@EnvironmentObject memoryStore)
```

## SwiftUI Patterns Used

1. **Environment Objects**: For dependency injection
2. **@Published Properties**: For reactive updates
3. **@StateObject**: For app-level state
4. **@EnvironmentObject**: For view-level access
5. **onChange Modifier**: For reacting to store changes
6. **LazyVStack**: For efficient list rendering

