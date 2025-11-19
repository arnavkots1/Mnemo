import SwiftUI

/// Settings view with privacy controls and service toggles
struct SettingsView: View {
    @EnvironmentObject var memoryStore: InMemoryMemoryStore
    @EnvironmentObject var settingsStore: SettingsStore
    @State private var showDeleteConfirmation = false
    @State private var showPermissionsInfo = false
    
    var body: some View {
        NavigationView {
            Form {
                // Passive Context Logging Section
                Section {
                    Toggle(isOn: $settingsStore.isPassiveContextLoggingEnabled) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Enable Passive Context Logging")
                                .font(.body)
                            Text("Automatically log location visits and activities")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    if settingsStore.isPassiveContextLoggingEnabled {
                        Toggle(isOn: $settingsStore.useMotionActivity) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Use Motion Activity")
                                    .font(.body)
                                Text("Detect walking, running, or stationary activity")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Toggle(isOn: $settingsStore.useCalendarEvents) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Use Calendar Events")
                                    .font(.body)
                                Text("Enrich memories with calendar event titles")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                } header: {
                    Text("Passive Context Logging")
                } footer: {
                    Text("When enabled, Mnemo automatically logs where you were and what you were doing. All data is stored locally on your device.")
                }
                
                // Emotional Capture Section
                Section {
                    // Emotion model status (debug)
                    HStack {
                        Text("Emotion Model")
                        Spacer()
                        HStack(spacing: 4) {
                            let isLoaded = isEmotionModelAvailable()
                            Image(systemName: isLoaded ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundColor(isLoaded ? .green : .red)
                            Text(isLoaded ? "✅ Loaded" : "❌ Not loaded")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .help("Shows if Core ML emotion model is available. If not loaded, add EmotionAudioClassifier.mlmodel to Xcode project.")
                    
                    Toggle(isOn: $settingsStore.autoDeleteRawAudio) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Auto-delete Raw Audio")
                                .font(.body)
                            Text("Automatically delete audio files after \(settingsStore.audioRetentionMinutes) minutes")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    if settingsStore.autoDeleteRawAudio {
                        Stepper(
                            "Retention: \(settingsStore.audioRetentionMinutes) minutes",
                            value: $settingsStore.audioRetentionMinutes,
                            in: 1...60
                        )
                    }
                    
                    Toggle(isOn: $settingsStore.allowSpeechRecognition) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Allow Speech Recognition")
                                .font(.body)
                            Text("Store transcripts of emotional moments")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                } header: {
                    Text("Emotional Capture")
                } footer: {
                    Text("Control how emotional capture sessions store audio and transcripts. Raw audio is never stored unless explicitly enabled.")
                }
                
                // Data & Privacy Section
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Privacy Model")
                            .font(.headline)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            PrivacyBullet(text: "All data stored locally by default")
                            PrivacyBullet(text: "No secret recording; mic is only used during explicit Emotional Capture Sessions")
                            PrivacyBullet(text: "Location tracking requires explicit permission and can be disabled anytime")
                            PrivacyBullet(text: "You can delete all data at any time")
                        }
                    }
                    .padding(.vertical, 8)
                    
                    Button(role: .destructive) {
                        showDeleteConfirmation = true
                    } label: {
                        HStack {
                            Image(systemName: "trash")
                            Text("Delete All Data")
                        }
                    }
                    
                    Button {
                        showPermissionsInfo = true
                    } label: {
                        HStack {
                            Image(systemName: "lock.shield")
                            Text("Review Permissions")
                        }
                    }
                } header: {
                    Text("Data & Privacy")
                } footer: {
                    Text("Mnemo respects your privacy. All processing happens on your device, and you have full control over your data.")
                }
                
                // About Section
                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                } header: {
                    Text("About")
                }
            }
            .navigationTitle("Settings")
            .alert("Delete All Data", isPresented: $showDeleteConfirmation) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    deleteAllData()
                }
            } message: {
                Text("This will permanently delete all your memories, including context logs, emotional moments, and photo moments. This action cannot be undone.")
            }
            .sheet(isPresented: $showPermissionsInfo) {
                PermissionsInfoView()
            }
        }
    }
    
    private func deleteAllData() {
        // Delete all memories
        do {
            try memoryStore.deleteAll()
        } catch {
            print("Error deleting all data: \(error)")
        }
        
        // TODO: Delete cached audio/transcript files if they exist
        // This would be handled by EmotionalCaptureService cleanup
        
        // Reset settings to defaults (optional)
        // settingsStore.resetToDefaults()
    }
    
    /// Check if Core ML emotion model is available in bundle
    private func isEmotionModelAvailable() -> Bool {
        // Check if model file exists in bundle
        let modelURL = Bundle.main.url(forResource: "EmotionAudioClassifier", withExtension: "mlmodelc") ??
                       Bundle.main.url(forResource: "EmotionAudioClassifier", withExtension: "mlmodel")
        return modelURL != nil
    }
}

/// Privacy bullet point view
struct PrivacyBullet: View {
    let text: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.caption)
            Text(text)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

/// Permissions info view
struct PermissionsInfoView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("To review or change permissions:")
                        .font(.headline)
                    
                    VStack(alignment: .leading, spacing: 12) {
                        PermissionStep(
                            number: 1,
                            title: "Open iOS Settings",
                            description: "Tap the Settings app on your home screen"
                        )
                        
                        PermissionStep(
                            number: 2,
                            title: "Find Mnemo",
                            description: "Scroll down and tap on 'Mnemo'"
                        )
                        
                        PermissionStep(
                            number: 3,
                            title: "Review Permissions",
                            description: "You'll see options for Location, Microphone, Calendar, and Motion"
                        )
                    }
                    
                    Button {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        HStack {
                            Image(systemName: "arrow.right.circle.fill")
                            Text("Open Settings")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(12)
                    }
                    .padding(.top)
                }
                .padding()
            }
            .navigationTitle("Review Permissions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

/// Permission step view
struct PermissionStep: View {
    let number: Int
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.headline)
                .foregroundColor(.white)
                .frame(width: 28, height: 28)
                .background(Color.blue)
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}
