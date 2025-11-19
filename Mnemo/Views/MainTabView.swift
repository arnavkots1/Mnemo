import SwiftUI

/// Root view with TabView containing the three main tabs
struct RootView: View {
    @EnvironmentObject var memoryStore: InMemoryMemoryStore
    
    var body: some View {
        TabView {
            TodayView()
                .tabItem {
                    Label("Today", systemImage: "calendar")
                }
            
            MomentsView()
                .tabItem {
                    Label("Moments", systemImage: "photo.on.rectangle")
                }
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
    }
}

