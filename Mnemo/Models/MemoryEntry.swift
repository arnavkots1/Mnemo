import Foundation
import CoreLocation

/// Represents a single memory entry in the user's timeline
struct MemoryEntry: Identifiable, Codable {
    let id: UUID
    let kind: MemoryKind
    let startTime: Date
    var endTime: Date?
    var latitude: Double?
    var longitude: Double?
    var placeName: String?
    var activityType: ActivityType
    var summary: String
    var details: [String: AnyCodable]
    
    init(
        id: UUID = UUID(),
        kind: MemoryKind,
        startTime: Date,
        endTime: Date? = nil,
        latitude: Double? = nil,
        longitude: Double? = nil,
        placeName: String? = nil,
        activityType: ActivityType = .unknown,
        summary: String,
        details: [String: AnyCodable] = [:]
    ) {
        self.id = id
        self.kind = kind
        self.startTime = startTime
        self.endTime = endTime
        self.latitude = latitude
        self.longitude = longitude
        self.placeName = placeName
        self.activityType = activityType
        self.summary = summary
        self.details = details
    }
    
    /// Convenience initializer for location-based entries
    init(
        kind: MemoryKind,
        startTime: Date,
        endTime: Date? = nil,
        location: CLLocation? = nil,
        placeName: String? = nil,
        activityType: ActivityType = .unknown,
        summary: String,
        details: [String: AnyCodable] = [:]
    ) {
        self.init(
            kind: kind,
            startTime: startTime,
            endTime: endTime,
            latitude: location?.coordinate.latitude,
            longitude: location?.coordinate.longitude,
            placeName: placeName,
            activityType: activityType,
            summary: summary,
            details: details
        )
    }
}

/// Type of memory entry
enum MemoryKind: String, Codable {
    case context      // Passive context logging (location/motion/calendar)
    case emotional    // Emotional capture session moment
    case photo        // User-selected photo moment
}

/// Activity type classification
enum ActivityType: String, Codable {
    case stationary
    case walking
    case running
    case automotive
    case unknown
}

/// Helper type to encode/decode Any values in dictionaries
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            value = dictionary.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "AnyCodable value cannot be decoded"
            )
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            let codableArray = array.map { AnyCodable($0) }
            try container.encode(codableArray)
        case let dictionary as [String: Any]:
            let codableDictionary = dictionary.mapValues { AnyCodable($0) }
            try container.encode(codableDictionary)
        default:
            let context = EncodingError.Context(
                codingPath: container.codingPath,
                debugDescription: "AnyCodable value cannot be encoded"
            )
            throw EncodingError.invalidValue(value, context)
        }
    }
}

