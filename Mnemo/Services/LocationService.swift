import Foundation
import CoreLocation
import Combine

/// Protocol for location tracking services
protocol LocationService {
    /// Publisher for location updates
    var locationPublisher: AnyPublisher<CLLocation?, Never> { get }
    
    /// Publisher for visit updates
    var visitPublisher: AnyPublisher<CLVisit?, Never> { get }
    
    /// Current authorization status
    var authorizationStatus: CLAuthorizationStatus { get }
    
    /// Request location permissions
    func requestAuthorization() throws
    
    /// Start monitoring significant location changes
    func startMonitoring()
    
    /// Stop monitoring
    func stopMonitoring()
    
    /// Reverse geocode a location to get place name
    func reverseGeocode(location: CLLocation) async -> String?
}

/// Implementation using CLLocationManager
/// Designed to run in background with significant location changes and visit monitoring
class CLLocationService: NSObject, LocationService {
    private let locationManager = CLLocationManager()
    private let locationSubject = PassthroughSubject<CLLocation?, Never>()
    private let visitSubject = PassthroughSubject<CLVisit?, Never>()
    private let geocoder = CLGeocoder()
    
    var locationPublisher: AnyPublisher<CLLocation?, Never> {
        locationSubject.eraseToAnyPublisher()
    }
    
    var visitPublisher: AnyPublisher<CLVisit?, Never> {
        visitSubject.eraseToAnyPublisher()
    }
    
    var authorizationStatus: CLAuthorizationStatus {
        locationManager.authorizationStatus
    }
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        locationManager.pausesLocationUpdatesAutomatically = true
        
        // Enable background location updates for visit monitoring
        // Note: This requires "Uses background location" capability in Info.plist
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.showsBackgroundLocationIndicator = true
    }
    
    func requestAuthorization() throws {
        guard authorizationStatus == .notDetermined else {
            return
        }
        // Request Always authorization for background visit monitoring
        locationManager.requestAlwaysAuthorization()
    }
    
    func startMonitoring() {
        // Only start if we have Always authorization (required for background)
        guard authorizationStatus == .authorizedAlways else {
            return
        }
        
        // Start monitoring significant location changes
        locationManager.startMonitoringSignificantLocationChanges()
        
        // Start monitoring visits (requires Always authorization)
        locationManager.startMonitoringVisits()
    }
    
    func stopMonitoring() {
        locationManager.stopMonitoringSignificantLocationChanges()
        locationManager.stopMonitoringVisits()
        locationManager.allowsBackgroundLocationUpdates = false
    }
    
    /// Reverse geocode a location to get place name
    /// This is used when creating MemoryEntry from visits
    func reverseGeocode(location: CLLocation) async -> String? {
        do {
            let placemarks = try await geocoder.reverseGeocodeLocation(location)
            guard let placemark = placemarks.first else { return nil }
            
            // Build a readable place name from address components
            var components: [String] = []
            if let name = placemark.name {
                components.append(name)
            }
            if let locality = placemark.locality {
                components.append(locality)
            }
            if let administrativeArea = placemark.administrativeArea {
                components.append(administrativeArea)
            }
            
            return components.isEmpty ? nil : components.joined(separator: ", ")
        } catch {
            print("Reverse geocoding error: \(error)")
            return nil
        }
    }
}

extension CLLocationService: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        locationSubject.send(locations.last)
    }
    
    func locationManager(_ manager: CLLocationManager, didVisit visit: CLVisit) {
        visitSubject.send(visit)
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        locationSubject.send(nil)
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if authorizationStatus == .authorizedAlways || authorizationStatus == .authorizedWhenInUse {
            startMonitoring()
        }
    }
}

