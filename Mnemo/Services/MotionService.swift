import Foundation
import CoreMotion
import Combine

/// Protocol for motion activity classification
protocol MotionService {
    /// Publisher for activity updates
    var activityPublisher: AnyPublisher<CMMotionActivity?, Never> { get }
    
    /// Current activity type (simplified)
    var currentActivity: ActivityType { get }
    
    /// Get the dominant activity type for a given time period
    /// This helps enrich MemoryEntry with activity context
    func dominantActivity(for timeRange: DateInterval) -> ActivityType
    
    /// Start monitoring motion activity
    func startMonitoring() throws
    
    /// Stop monitoring
    func stopMonitoring()
}

/// Implementation using CMMotionActivityManager
/// Periodically determines dominant ActivityType for enriching MemoryEntry
class CMMotionService: MotionService {
    private let activityManager = CMMotionActivityManager()
    private let activitySubject = PassthroughSubject<CMMotionActivity?, Never>()
    private var currentActivityValue: ActivityType = .unknown
    
    // Store recent activities with timestamps for determining dominant activity
    private var recentActivities: [(date: Date, activity: ActivityType)] = []
    private let maxRecentActivities = 100 // Keep last 100 activities
    
    var activityPublisher: AnyPublisher<CMMotionActivity?, Never> {
        activitySubject.eraseToAnyPublisher()
    }
    
    var currentActivity: ActivityType {
        currentActivityValue
    }
    
    func startMonitoring() throws {
        guard CMMotionActivityManager.isActivityAvailable() else {
            throw MotionServiceError.activityNotAvailable
        }
        
        activityManager.startActivityUpdates(to: .main) { [weak self] activity in
            guard let activity = activity else {
                self?.activitySubject.send(nil)
                return
            }
            
            let activityType: ActivityType
            if activity.walking {
                activityType = .walking
            } else if activity.running {
                activityType = .running
            } else if activity.automotive {
                activityType = .automotive
            } else if activity.stationary {
                activityType = .stationary
            } else {
                activityType = .unknown
            }
            
            // Update current activity
            self?.currentActivityValue = activityType
            
            // Store for historical analysis
            self?.recordActivity(activityType, at: activity.startDate)
            
            self?.activitySubject.send(activity)
        }
    }
    
    func stopMonitoring() {
        activityManager.stopActivityUpdates()
        recentActivities.removeAll()
    }
    
    func dominantActivity(for timeRange: DateInterval) -> ActivityType {
        // Filter activities within the time range
        let activitiesInRange = recentActivities.filter { entry in
            timeRange.contains(entry.date)
        }
        
        guard !activitiesInRange.isEmpty else {
            return currentActivity // Fallback to current if no history
        }
        
        // Count occurrences of each activity type
        var counts: [ActivityType: Int] = [:]
        for (_, activity) in activitiesInRange {
            counts[activity, default: 0] += 1
        }
        
        // Return the most common activity type
        return counts.max(by: { $0.value < $1.value })?.key ?? .unknown
    }
    
    private func recordActivity(_ activity: ActivityType, at date: Date) {
        recentActivities.append((date: date, activity: activity))
        
        // Keep only recent activities
        if recentActivities.count > maxRecentActivities {
            recentActivities.removeFirst()
        }
    }
}

enum MotionServiceError: Error {
    case activityNotAvailable
}

