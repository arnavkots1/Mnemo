import SwiftUI

@main
struct MnemoApp: App {
    // Create a single MemoryStore instance and inject it into the environment
    @StateObject private var memoryStore: InMemoryMemoryStore = InMemoryMemoryStore()
    
    // Create SettingsStore and inject it into the environment
    @StateObject private var settingsStore = SettingsStore()
    
    // Context logging coordinator for passive context logging
    // Initialized lazily to ensure memoryStore and settingsStore are available
    private lazy var contextCoordinator: ContextLoggingCoordinator = {
        let locationService = CLLocationService()
        let motionService = CMMotionService()
        let calendarService = EKCalendarService()
        
        return ContextLoggingCoordinator(
            memoryStore: memoryStore,
            locationService: locationService,
            motionService: motionService,
            calendarService: calendarService,
            settingsStore: settingsStore
        )
    }()
    
    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(memoryStore)
                .environmentObject(settingsStore)
                .onAppear {
                    // Start context logging when app launches
                    // Will respect user settings via SettingsStore
                    if settingsStore.isPassiveContextLoggingEnabled {
                        contextCoordinator.start()
                    }
                }
        }
    }
}

