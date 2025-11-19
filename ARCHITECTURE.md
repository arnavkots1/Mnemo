# Mnemo Architecture

## Folder Structure

```
Mnemo/
├── App/                    # Application entry point and state management
│   ├── MnemoApp.swift      # Main @main app struct
│   └── AppState.swift      # Central state coordinator
│
├── Models/                 # Core data models
│   └── MemoryEntry.swift   # MemoryEntry struct, MemoryKind, ActivityType enums
│
├── Stores/                 # Data persistence layer
│   └── InMemoryMemoryStore.swift  # ObservableObject in-memory store
│
├── Services/               # Business logic services
│   ├── MemoryStore.swift   # MemoryStore protocol + FileMemoryStore
│   ├── LocationService.swift
│   ├── MotionService.swift
│   ├── CalendarService.swift
│   ├── EmotionalCaptureService.swift
│   └── PhotoImportService.swift
│
└── Views/                  # SwiftUI views
    ├── MainTabView.swift
    ├── TodayView.swift
    ├── MomentsView.swift
    ├── SettingsView.swift
    ├── EmotionalCaptureView.swift
    └── PhotoPickerView.swift
```

## Core Data Models

### MemoryKind Enum
```swift
enum MemoryKind: String, Codable {
    case context      // Passive context logging
    case emotional    // Emotional capture session moment
    case photo        // User-selected photo moment
}
```

### ActivityType Enum
```swift
enum ActivityType: String, Codable {
    case stationary
    case walking
    case running
    case automotive
    case unknown
}
```

### MemoryEntry Struct
- `id: UUID`
- `kind: MemoryKind`
- `startTime: Date`
- `endTime: Date?`
- `latitude: Double?`
- `longitude: Double?`
- `placeName: String?`
- `activityType: ActivityType`
- `summary: String`
- `details: [String: AnyCodable]`

## MemoryStore Protocol

The `MemoryStore` protocol defines the core interface for memory persistence:

```swift
protocol MemoryStore {
    func add(_ memory: MemoryEntry) throws
    func update(_ memory: MemoryEntry) throws
    func memories(forDay date: Date) -> [MemoryEntry]
    func recentMoments(limit: Int) -> [MemoryEntry]
    func deleteAll() throws
}
```

### Implementations

1. **InMemoryMemoryStore** (`Stores/InMemoryMemoryStore.swift`)
   - Conforms to `ObservableObject` for SwiftUI observation
   - Uses `@Published` property for reactive updates
   - Perfect for testing and SwiftUI previews
   - All data stored in memory

2. **FileMemoryStore** (`Services/MemoryStore.swift`)
   - File-based persistence using JSON encoding
   - Stores data in Documents directory
   - Suitable for production use
   - Can be upgraded to Core Data later

## Service Layer

All services follow a protocol-based architecture for:
- **Testability**: Easy to mock in tests
- **Flexibility**: Swap implementations easily
- **Dependency Injection**: Clean separation of concerns

### Key Services

- **LocationService**: CLLocationManager wrapper for location tracking
- **MotionService**: CMMotionActivityManager for activity classification
- **CalendarService**: EventKit integration for calendar events
- **EmotionalCaptureService**: AVAudioEngine + speech recognition
- **PhotoImportService**: Photos framework integration

## Usage Example

### Using InMemoryMemoryStore in SwiftUI

```swift
@StateObject private var memoryStore = InMemoryMemoryStore()

var body: some View {
    List(memoryStore.memories) { memory in
        Text(memory.summary)
    }
    .onAppear {
        try? memoryStore.add(MemoryEntry(...))
    }
}
```

### Using FileMemoryStore

```swift
let store = FileMemoryStore()
try store.add(memory)
let todayMemories = store.memories(forDay: Date())
let recentMoments = store.recentMoments(limit: 10)
```

## Design Principles

1. **Protocol-Oriented**: Services use protocols for flexibility
2. **Observable**: InMemoryMemoryStore is ObservableObject for SwiftUI
3. **Error Handling**: All operations throw errors appropriately
4. **Backward Compatible**: Legacy methods maintained for existing code
5. **Clean Architecture**: Clear separation between models, stores, services, and views

