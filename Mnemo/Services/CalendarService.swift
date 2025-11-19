import Foundation
import EventKit
import Combine

/// Protocol for calendar event access
protocol CalendarService {
    /// Publisher for calendar events
    var eventsPublisher: AnyPublisher<[EKEvent], Never> { get }
    
    /// Current authorization status
    var authorizationStatus: EKAuthorizationStatus { get }
    
    /// Request calendar permissions
    func requestAuthorization() async throws
    
    /// Fetch events for a date range
    func fetchEvents(from startDate: Date, to endDate: Date) async throws -> [EKEvent]
    
    /// Find calendar events that overlap with a given time range
    /// Used to enrich MemoryEntry summaries with calendar event titles
    func findOverlappingEvents(for timeRange: DateInterval) async throws -> [EKEvent]
    
    /// Start monitoring calendar events (periodic updates)
    func startMonitoring()
    
    /// Stop monitoring
    func stopMonitoring()
}

/// Implementation using EventKit
class EKCalendarService: CalendarService {
    private let eventStore = EKEventStore()
    private let eventsSubject = PassthroughSubject<[EKEvent], Never>()
    private var monitoringTimer: Timer?
    
    var eventsPublisher: AnyPublisher<[EKEvent], Never> {
        eventsSubject.eraseToAnyPublisher()
    }
    
    var authorizationStatus: EKAuthorizationStatus {
        EKEventStore.authorizationStatus(for: .event)
    }
    
    func requestAuthorization() async throws {
        let status = await eventStore.requestAccess(to: .event)
        if !status {
            throw CalendarServiceError.accessDenied
        }
    }
    
    func fetchEvents(from startDate: Date, to endDate: Date) async throws -> [EKEvent] {
        guard authorizationStatus == .authorized else {
            throw CalendarServiceError.notAuthorized
        }
        
        let predicate = eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: nil)
        return eventStore.events(matching: predicate)
    }
    
    func findOverlappingEvents(for timeRange: DateInterval) async throws -> [EKEvent] {
        guard authorizationStatus == .authorized else {
            return [] // Return empty array if not authorized (calendar is optional)
        }
        
        // Fetch events that might overlap (expand search window slightly)
        let expandedStart = timeRange.start.addingTimeInterval(-3600) // 1 hour before
        let expandedEnd = timeRange.end.addingTimeInterval(3600) // 1 hour after
        
        let allEvents = try await fetchEvents(from: expandedStart, to: expandedEnd)
        
        // Filter for events that actually overlap with the time range
        return allEvents.filter { event in
            let eventRange = DateInterval(start: event.startDate, end: event.endDate)
            return eventRange.intersects(timeRange)
        }
    }
    
    func startMonitoring() {
        // Update events every 15 minutes
        monitoringTimer = Timer.scheduledTimer(withTimeInterval: 900, repeats: true) { [weak self] _ in
            Task {
                await self?.updateEvents()
            }
        }
        
        // Initial update
        Task {
            await updateEvents()
        }
    }
    
    func stopMonitoring() {
        monitoringTimer?.invalidate()
        monitoringTimer = nil
    }
    
    private func updateEvents() async {
        let now = Date()
        let endDate = Calendar.current.date(byAdding: .day, value: 1, to: now) ?? now
        
        do {
            let events = try await fetchEvents(from: now, to: endDate)
            eventsSubject.send(events)
        } catch {
            // Silently fail - calendar access is optional
            eventsSubject.send([])
        }
    }
}

enum CalendarServiceError: Error {
    case accessDenied
    case notAuthorized
}

