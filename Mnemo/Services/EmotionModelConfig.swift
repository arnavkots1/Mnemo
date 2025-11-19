import Foundation

/// Configuration constants for emotion detection
struct EmotionModelConfig {
    /// Confidence threshold for detecting emotional events
    /// Values above this threshold trigger an event
    /// Range: 0.0 to 1.0
    /// NOTE: Lowered to 0.4 for easier testing - increase to 0.7+ for production
    static var detectionThreshold: Double = 0.4  // Testing value (production: 0.7)
    
    /// Minimum confidence for specific emotions to trigger events
    /// Only emotions with confidence above this will be considered
    static var minEmotionConfidence: Double = 0.5
    
    /// Emotions that should trigger events when detected
    /// Other emotions are logged but don't trigger events
    static var triggerEmotions: Set<Emotion> = [.happy, .surprised]
    
    /// Time window for classification (seconds)
    /// Model runs on this duration of audio
    static var classificationWindowDuration: TimeInterval = 1.0
    
    /// Overlap between classification windows (seconds)
    /// Smaller overlap = more frequent classification, higher CPU usage
    /// Larger overlap = less frequent classification, lower CPU usage
    static var windowOverlap: TimeInterval = 0.5
    
    /// Cooldown period after detecting an event (seconds)
    /// Prevents multiple events from the same continuous emotion
    static var eventCooldownPeriod: TimeInterval = 3.0
    
    /// Number of consecutive detections required before triggering event
    /// Helps smooth out false positives
    /// NOTE: Set to 1 for easier testing - increase to 2+ for production
    static var consecutiveDetectionsRequired: Int = 1  // Testing value (production: 2)
    
    /// Classification frequency: how often to run model (seconds)
    /// Model runs every N seconds on the latest audio window
    static var classificationInterval: TimeInterval = 0.5
}

