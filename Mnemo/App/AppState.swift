import Foundation
import Combine
import SwiftUI
import CoreLocation
import EventKit

/// Central app state manager that coordinates all services
class AppState: ObservableObject {
    // Services (injected)
    var memoryStore: MemoryStore?
    var locationService: LocationService?
    var motionService: MotionService?
    var calendarService: CalendarService?
    var emotionalCaptureService: EmotionalCaptureService?
    var photoImportService: PhotoImportService?
    
    // Published state
    @Published var memories: [MemoryEntry] = []
    @Published var isPassiveContextEnabled = true
    @Published var isMotionEnabled = true
    @Published var isCalendarEnabled = false
    
    // Subscriptions
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Load initial memories
        loadMemories()
    }
    
    func loadMemories() {
        guard let store = memoryStore else { return }
        do {
            memories = try store.getAllEntries()
        } catch {
            print("Error loading memories: \(error)")
        }
    }
    
    func startPassiveContextLogging() {
        guard isPassiveContextEnabled else { return }
        
        // Start location monitoring
        if let locationService = locationService {
            do {
                try locationService.requestAuthorization()
                locationService.startMonitoring()
                
                // Subscribe to location updates
                locationService.locationPublisher
                    .compactMap { $0 }
                    .sink { [weak self] location in
                        self?.handleLocationUpdate(location)
                    }
                    .store(in: &cancellables)
                
                // Subscribe to visit updates
                locationService.visitPublisher
                    .compactMap { $0 }
                    .sink { [weak self] visit in
                        self?.handleVisit(visit)
                    }
                    .store(in: &cancellables)
            } catch {
                print("Error starting location service: \(error)")
            }
        }
        
        // Start motion monitoring
        if isMotionEnabled, let motionService = motionService {
            do {
                try motionService.startMonitoring()
                
                motionService.activityPublisher
                    .compactMap { $0 }
                    .sink { [weak self] activity in
                        // Motion updates can be used to enrich location-based memories
                    }
                    .store(in: &cancellables)
            } catch {
                print("Error starting motion service: \(error)")
            }
        }
        
        // Start calendar monitoring
        if isCalendarEnabled, let calendarService = calendarService {
            Task {
                do {
                    try await calendarService.requestAuthorization()
                    calendarService.startMonitoring()
                    
                    calendarService.eventsPublisher
                        .sink { [weak self] events in
                            self?.handleCalendarEvents(events)
                        }
                        .store(in: &cancellables)
                } catch {
                    print("Error starting calendar service: \(error)")
                }
            }
        }
    }
    
    func stopPassiveContextLogging() {
        locationService?.stopMonitoring()
        motionService?.stopMonitoring()
        calendarService?.stopMonitoring()
        cancellables.removeAll()
    }
    
    private func handleLocationUpdate(_ location: CLLocation) {
        guard let store = memoryStore else { return }
        
        // Create a context memory entry for significant location changes
        let entry = MemoryEntry(
            kind: .context,
            startTime: Date(),
            location: location,
            activityType: motionService?.currentActivity ?? .unknown,
            summary: generateLocationSummary(location: location, activity: motionService?.currentActivity ?? .unknown)
        )
        
        do {
            try store.save(entry)
            loadMemories()
        } catch {
            print("Error saving location memory: \(error)")
        }
    }
    
    private func handleVisit(_ visit: CLVisit) {
        guard let store = memoryStore else { return }
        
        let location = CLLocation(latitude: visit.coordinate.latitude, longitude: visit.coordinate.longitude)
        let entry = MemoryEntry(
            kind: .context,
            startTime: visit.arrivalDate,
            endTime: visit.departureDate == Date.distantPast ? nil : visit.departureDate,
            location: location,
            activityType: .stationary,
            summary: generateVisitSummary(visit: visit)
        )
        
        do {
            try store.save(entry)
            loadMemories()
        } catch {
            print("Error saving visit memory: \(error)")
        }
    }
    
    private func handleCalendarEvents(_ events: [EKEvent]) {
        guard let store = memoryStore else { return }
        
        for event in events {
            let entry = MemoryEntry(
                kind: .context,
                startTime: event.startDate,
                endTime: event.endDate,
                placeName: event.location,
                activityType: .stationary,
                summary: "\(event.title ?? "Calendar event")",
                details: [
                    "eventIdentifier": AnyCodable(event.eventIdentifier),
                    "calendarTitle": AnyCodable(event.calendar.title)
                ]
            )
            
            do {
                try store.save(entry)
            } catch {
                print("Error saving calendar memory: \(error)")
            }
        }
        
        loadMemories()
    }
    
    private func generateLocationSummary(location: CLLocation, activity: ActivityType) -> String {
        let activityString: String
        switch activity {
        case .walking:
            activityString = "walking"
        case .running:
            activityString = "running"
        case .automotive:
            activityString = "commuting"
        case .stationary:
            activityString = "stationary"
        case .unknown:
            activityString = "traveling"
        }
        
        return "\(activityString.capitalized) at location"
    }
    
    private func generateVisitSummary(visit: CLVisit) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        
        let arrivalTime = formatter.string(from: visit.arrivalDate)
        let departureTime = visit.departureDate == Date.distantPast ? nil : formatter.string(from: visit.departureDate)
        
        if let departure = departureTime {
            return "Visit from \(arrivalTime) to \(departure)"
        } else {
            return "Visit starting at \(arrivalTime)"
        }
    }
}

