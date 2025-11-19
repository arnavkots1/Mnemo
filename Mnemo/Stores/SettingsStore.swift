import Foundation
import Combine

/// Observable settings store that persists user preferences
/// Uses UserDefaults for persistence
class SettingsStore: ObservableObject {
    // MARK: - Published Properties
    
    // Passive Context Logging
    @Published var isPassiveContextLoggingEnabled: Bool {
        didSet { save(key: "isPassiveContextLoggingEnabled", value: isPassiveContextLoggingEnabled) }
    }
    
    @Published var useMotionActivity: Bool {
        didSet { save(key: "useMotionActivity", value: useMotionActivity) }
    }
    
    @Published var useCalendarEvents: Bool {
        didSet { save(key: "useCalendarEvents", value: useCalendarEvents) }
    }
    
    // Emotional Capture
    @Published var autoDeleteRawAudio: Bool {
        didSet { save(key: "autoDeleteRawAudio", value: autoDeleteRawAudio) }
    }
    
    @Published var allowSpeechRecognition: Bool {
        didSet { save(key: "allowSpeechRecognition", value: allowSpeechRecognition) }
    }
    
    // Audio retention (in minutes)
    @Published var audioRetentionMinutes: Int {
        didSet { save(key: "audioRetentionMinutes", value: audioRetentionMinutes) }
    }
    
    // MARK: - Initialization
    
    private let userDefaults: UserDefaults
    
    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
        
        // Load saved values or use defaults
        self.isPassiveContextLoggingEnabled = userDefaults.bool(forKey: "isPassiveContextLoggingEnabled", defaultValue: true)
        self.useMotionActivity = userDefaults.bool(forKey: "useMotionActivity", defaultValue: true)
        self.useCalendarEvents = userDefaults.bool(forKey: "useCalendarEvents", defaultValue: false)
        self.autoDeleteRawAudio = userDefaults.bool(forKey: "autoDeleteRawAudio", defaultValue: true)
        self.allowSpeechRecognition = userDefaults.bool(forKey: "allowSpeechRecognition", defaultValue: true)
        self.audioRetentionMinutes = userDefaults.integer(forKey: "audioRetentionMinutes", defaultValue: 5)
    }
    
    // MARK: - Persistence
    
    private func save(key: String, value: Any) {
        userDefaults.set(value, forKey: key)
        objectWillChange.send()
    }
    
    // MARK: - Reset
    
    func resetToDefaults() {
        isPassiveContextLoggingEnabled = true
        useMotionActivity = true
        useCalendarEvents = false
        autoDeleteRawAudio = true
        allowSpeechRecognition = true
        audioRetentionMinutes = 5
    }
}

// MARK: - UserDefaults Extensions

extension UserDefaults {
    func bool(forKey key: String, defaultValue: Bool) -> Bool {
        if object(forKey: key) == nil {
            return defaultValue
        }
        return bool(forKey: key)
    }
    
    func integer(forKey key: String, defaultValue: Int) -> Int {
        if object(forKey: key) == nil {
            return defaultValue
        }
        return integer(forKey: key)
    }
}

