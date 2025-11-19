# Passive Context Logging Implementation

## Overview

The passive context logging system combines location visits, motion activity, and calendar events to automatically create `.context` MemoryEntry objects.

## Architecture

### Services

#### LocationService (`CLLocationService`)
- **Purpose**: Monitors location visits using `CLLocationManager`
- **Features**:
  - Requests "Always" location permission (required for background)
  - Enables `startMonitoringSignificantLocationChanges()`
  - Enables `startMonitoringVisits()`
  - Background location updates enabled (`allowsBackgroundLocationUpdates = true`)
  - Background location indicator shown (`showsBackgroundLocationIndicator = true`)
  - Reverse geocoding via `CLGeocoder` to get place names

**Configuration Notes**:
- Requires "Uses background location" capability in Info.plist
- Requires "Always" location permission (not "When In Use")
- Visit monitoring only works with Always authorization

#### MotionService (`CMMotionService`)
- **Purpose**: Tracks motion activity to enrich location entries
- **Features**:
  - Uses `CMMotionActivityManager` for activity classification
  - Tracks dominant activity type over time periods
  - Provides `dominantActivity(for:)` method to determine activity for a visit
  - Stores recent activities (last 100) for historical analysis

**Activity Types**:
- `.walking` - User is walking
- `.running` - User is running
- `.automotive` - User is in a vehicle
- `.stationary` - User is stationary
- `.unknown` - Activity cannot be determined

#### CalendarService (`EKCalendarService`)
- **Purpose**: Finds overlapping calendar events to enrich summaries
- **Features**:
  - Requests calendar access permission
  - Finds events overlapping a given time range
  - Used to append event titles to MemoryEntry summaries

**Example**: If a visit overlaps with "Team Meeting", the summary becomes:
"Visit at Office (stationary), 2:00 PM - 3:00 PM – Team Meeting"

### ContextLoggingCoordinator

**Purpose**: Coordinates all three services to create unified MemoryEntry objects

**Responsibilities**:
1. Owns instances of LocationService, MotionService, and CalendarService
2. Subscribes to visit updates from LocationService
3. For each visit:
   - Gets place name via reverse geocoding
   - Determines dominant activity type for the visit period
   - Finds overlapping calendar events
   - Creates/updates MemoryEntry with combined information
   - Saves to MemoryStore

**Visit Handling**:
- On `didVisit` callback:
  - Creates MemoryEntry with visit arrival time
  - Sets endTime if departure is known (not `Date.distantPast`)
  - Includes latitude/longitude from visit coordinates
  - Enriches with place name, activity type, and calendar events

**Summary Format**:
```
"Visit at [Place Name] ([activity]), [start] - [end] – [Event Title 1], [Event Title 2]"
```

Example: `"Visit at Coffee Shop (stationary), 10:00 AM - 10:30 AM – Morning Standup"`

## Integration

### App Lifecycle

The coordinator is initialized and started in `MnemoApp`:

```swift
@main
struct MnemoApp: App {
    @StateObject private var memoryStore: InMemoryMemoryStore = InMemoryMemoryStore()
    
    private lazy var contextCoordinator: ContextLoggingCoordinator = {
        // Initialize services and coordinator
    }()
    
    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(memoryStore)
                .onAppear {
                    contextCoordinator.start() // Start when app launches
                }
        }
    }
}
```

### Starting Services

When `contextCoordinator.start()` is called:
1. Requests location permission (Always)
2. Requests calendar permission
3. Starts motion monitoring
4. Starts location monitoring (visits + significant changes)
5. Starts calendar monitoring (periodic updates)
6. Subscribes to visit updates

### Stopping Services

Call `contextCoordinator.stop()` to:
- Stop all monitoring
- Clean up subscriptions
- Clear pending visits

## MemoryEntry Creation

Each visit creates a `.context` MemoryEntry with:

```swift
MemoryEntry(
    kind: .context,
    startTime: visit.arrivalDate,
    endTime: visit.departureDate (if known),
    latitude: visit.coordinate.latitude,
    longitude: visit.coordinate.longitude,
    placeName: "Reverse geocoded place name",
    activityType: dominantActivity(for: visitInterval),
    summary: "Visit at [Place] ([Activity]), [Time Range] – [Calendar Events]",
    details: [
        "visitIdentifier": coordinate string,
        "visitArrival": timestamp,
        "visitDeparture": timestamp (if known)
    ]
)
```

## Testing

All services use protocols for easy mocking:

- `LocationService` protocol → `CLLocationService` implementation
- `MotionService` protocol → `CMMotionService` implementation
- `CalendarService` protocol → `EKCalendarService` implementation

This allows:
- Unit testing with mock services
- Testing coordinator logic without actual hardware
- Isolated testing of each service

## Configuration Requirements

### Info.plist Entries

```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Mnemo needs location access to log where you were and create contextual memories.</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>Mnemo needs location access to log where you were and create contextual memories.</string>

<key>NSCalendarsUsageDescription</key>
<string>Mnemo can optionally log calendar events to enrich your memory timeline.</string>

<key>NSMotionUsageDescription</key>
<string>Mnemo uses motion activity to understand what you were doing (walking, stationary, etc.)</string>
```

### Capabilities

- **Background Modes** → **Location updates** (required for visit monitoring)

## Future Enhancements

- User settings to enable/disable each service
- Settings to control visit sensitivity
- Settings to control calendar event inclusion
- Better handling of visit updates (merging, deduplication)
- More sophisticated activity type determination
- Caching of reverse geocoded place names

