import Foundation
import CoreLocation
import Combine

/// Coordinates LocationService, MotionService, and CalendarService
/// to create and update .context MemoryEntry objects
/// 
/// This coordinator handles:
/// - Combining location visits with motion activity
/// - Enriching entries with calendar event information
/// - Creating/updating MemoryEntry in the MemoryStore
/// - Respecting SettingsStore preferences
class ContextLoggingCoordinator {
    private let memoryStore: MemoryStore
    private let locationService: LocationService
    private let motionService: MotionService
    private let calendarService: CalendarService
    private let settingsStore: SettingsStore
    
    private var cancellables = Set<AnyCancellable>()
    
    // Track pending visits that might need updates
    private var pendingVisits: [UUID: MemoryEntry] = [:]
    
    init(
        memoryStore: MemoryStore,
        locationService: LocationService,
        motionService: MotionService,
        calendarService: CalendarService,
        settingsStore: SettingsStore
    ) {
        self.memoryStore = memoryStore
        self.locationService = locationService
        self.motionService = motionService
        self.calendarService = calendarService
        self.settingsStore = settingsStore
        
        // Observe settings changes
        setupSettingsObservers()
    }
    
    private func setupSettingsObservers() {
        // Observe passive context logging toggle
        settingsStore.$isPassiveContextLoggingEnabled
            .sink { [weak self] enabled in
                if enabled {
                    self?.start()
                } else {
                    self?.stop()
                }
            }
            .store(in: &cancellables)
        
        // Observe motion activity toggle
        settingsStore.$useMotionActivity
            .sink { [weak self] enabled in
                if enabled {
                    do {
                        try self?.motionService.startMonitoring()
                    } catch {
                        print("Motion service error: \(error)")
                    }
                } else {
                    self?.motionService.stopMonitoring()
                }
            }
            .store(in: &cancellables)
        
        // Observe calendar events toggle
        settingsStore.$useCalendarEvents
            .sink { [weak self] enabled in
                if enabled {
                    Task {
                        do {
                            try await self?.calendarService.requestAuthorization()
                            self?.calendarService.startMonitoring()
                        } catch {
                            print("Calendar authorization error: \(error)")
                        }
                    }
                } else {
                    self?.calendarService.stopMonitoring()
                }
            }
            .store(in: &cancellables)
    }
    
    /// Start all context logging services
    func start() {
        // Request permissions
        Task {
            do {
                try locationService.requestAuthorization()
            } catch {
                print("Location authorization error: \(error)")
            }
            
            do {
                try await calendarService.requestAuthorization()
            } catch {
                print("Calendar authorization error: \(error)")
            }
        }
        
        // Start motion monitoring if enabled
        if settingsStore.useMotionActivity {
            do {
                try motionService.startMonitoring()
            } catch {
                print("Motion service error: \(error)")
            }
        }
        
        // Start location monitoring (will start automatically when authorized)
        locationService.startMonitoring()
        
        // Start calendar monitoring if enabled
        if settingsStore.useCalendarEvents {
            calendarService.startMonitoring()
        }
        
        // Subscribe to visit updates
        locationService.visitPublisher
            .compactMap { $0 }
            .sink { [weak self] visit in
                Task {
                    await self?.handleVisit(visit)
                }
            }
            .store(in: &cancellables)
    }
    
    /// Stop all context logging services
    func stop() {
        locationService.stopMonitoring()
        motionService.stopMonitoring()
        calendarService.stopMonitoring()
        cancellables.removeAll()
        pendingVisits.removeAll()
    }
    
    /// Handle a location visit and create/update MemoryEntry
    private func handleVisit(_ visit: CLVisit) async {
        let location = CLLocation(
            latitude: visit.coordinate.latitude,
            longitude: visit.coordinate.longitude
        )
        
        // Determine if this is a new visit or an update to existing visit
        let isDeparture = visit.departureDate != Date.distantPast
        
        // Get place name via reverse geocoding
        let placeName = await locationService.reverseGeocode(location: location)
        
        // Determine activity type for this visit period (if motion is enabled)
        let visitInterval = DateInterval(start: visit.arrivalDate, end: isDeparture ? visit.departureDate : Date())
        let activityType: ActivityType
        if settingsStore.useMotionActivity {
            activityType = motionService.dominantActivity(for: visitInterval)
        } else {
            activityType = .unknown
        }
        
        // Build summary
        var summary = buildVisitSummary(visit: visit, placeName: placeName, activityType: activityType)
        
        // Find overlapping calendar events and enrich summary (if calendar is enabled)
        if settingsStore.useCalendarEvents {
            let calendarEvents = try? await calendarService.findOverlappingEvents(for: visitInterval)
            if let events = calendarEvents, !events.isEmpty {
                let eventTitles = events.map { $0.title ?? "Untitled Event" }
                summary += " – \(eventTitles.joined(separator: ", "))"
            }
        }
        
        // Create or update MemoryEntry
        let entry = MemoryEntry(
            kind: .context,
            startTime: visit.arrivalDate,
            endTime: isDeparture ? visit.departureDate : nil,
            latitude: visit.coordinate.latitude,
            longitude: visit.coordinate.longitude,
            placeName: placeName,
            activityType: activityType,
            summary: summary,
            details: [
                "visitIdentifier": AnyCodable("\(visit.coordinate.latitude),\(visit.coordinate.longitude)"),
                "visitArrival": AnyCodable(visit.arrivalDate.timeIntervalSince1970),
                "visitDeparture": AnyCodable(isDeparture ? visit.departureDate.timeIntervalSince1970 : nil)
            ]
        )
        
        // Save to memory store
        do {
            try memoryStore.add(entry)
        } catch {
            // If entry already exists (same ID), try updating instead
            if case MemoryStoreError.duplicateEntry = error {
                do {
                    try memoryStore.update(entry)
                } catch {
                    print("Error updating memory entry: \(error)")
                }
            } else {
                print("Error adding memory entry: \(error)")
            }
        }
    }
    
    /// Build a human-readable summary for a visit
    private func buildVisitSummary(visit: CLVisit, placeName: String?, activityType: ActivityType) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        
        let arrivalTime = formatter.string(from: visit.arrivalDate)
        let isDeparture = visit.departureDate != Date.distantPast
        
        var summary: String
        
        if let place = placeName {
            summary = "Visit at \(place)"
        } else {
            summary = "Visit"
        }
        
        // Add activity context
        if activityType != .unknown {
            summary += " (\(activityType.rawValue))"
        }
        
        // Add time range
        if isDeparture {
            let departureTime = formatter.string(from: visit.departureDate)
            summary += ", \(arrivalTime) - \(departureTime)"
        } else {
            summary += " starting at \(arrivalTime)"
        }
        
        return summary
    }
}

