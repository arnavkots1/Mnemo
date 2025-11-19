import SwiftUI
import Combine

/// Full-screen view for emotional capture sessions
struct EmotionalSessionView: View {
    @EnvironmentObject var memoryStore: InMemoryMemoryStore
    @EnvironmentObject var settingsStore: SettingsStore
    @Environment(\.dismiss) var dismiss
    
    @StateObject private var captureService = AVAudioEmotionalCaptureService()
    @State private var isSessionActive = false
    @State private var sessionStartTime: Date?
    @State private var showToast = false
    @State private var toastMessage = ""
    @State private var detectedEvents: [EmotionalEvent] = []
    @State private var currentTime = Date()
    
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        ZStack {
            Color(.systemBackground)
                .ignoresSafeArea()
            
            VStack(spacing: 40) {
                // Header with End Session button
                HStack {
                    Spacer()
                    Button("End Session") {
                        endSession()
                    }
                    .foregroundColor(.red)
                    .font(.headline)
                    .padding()
                }
                
                Spacer()
                
                // Main content
                VStack(spacing: 30) {
                    // Large pulsing mic icon
                    Image(systemName: "mic.fill")
                        .font(.system(size: 120))
                        .foregroundColor(isSessionActive ? .red : .gray)
                        .scaleEffect(isSessionActive ? 1.1 : 1.0)
                        .animation(
                            Animation.easeInOut(duration: 1.0)
                                .repeatForever(autoreverses: true),
                            value: isSessionActive
                        )
                    
                    // Instruction text
                    VStack(spacing: 12) {
                        Text("Listening for laughs & emotional moments")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .multilineTextAlignment(.center)
                        
                        Text("Please keep this screen open")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal)
                    
                    // Timer
                    if let startTime = sessionStartTime {
                        Text(elapsedTimeString(from: startTime))
                            .font(.system(size: 48, weight: .bold, design: .monospaced))
                            .foregroundColor(.primary)
                            .onReceive(timer) { _ in
                                currentTime = Date()
                            }
                    }
                }
                
                Spacer()
                
                // Detected events count
                if !detectedEvents.isEmpty {
                    Text("\(detectedEvents.count) moment\(detectedEvents.count == 1 ? "" : "s") captured")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .padding()
                }
            }
            
            // Toast notification
            if showToast {
                VStack {
                    Spacer()
                    ToastView(message: toastMessage)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .padding(.bottom, 100)
                }
            }
        }
        .onAppear {
            // Inject settings store into capture service
            captureService.settingsStore = settingsStore
            startSession()
            setupSubscriptions()
        }
        .onDisappear {
            if isSessionActive {
                endSession()
            }
        }
    }
    
    private func setupSubscriptions() {
        captureService.emotionalEventPublisher
            .sink { [weak self] event in
                DispatchQueue.main.async {
                    self?.handleEmotionalEvent(event)
                }
            }
            .store(in: &cancellables)
    }
    
    private var cancellables = Set<AnyCancellable>()
    
    private func startSession() {
        Task {
            do {
                try await captureService.startSession()
                await MainActor.run {
                    isSessionActive = true
                    sessionStartTime = Date()
                    detectedEvents = []
                }
            } catch {
                print("Error starting session: \(error)")
                // Show error and dismiss
                await MainActor.run {
                    dismiss()
                }
            }
        }
    }
    
    private func endSession() {
        captureService.stopSession()
        isSessionActive = false
        sessionStartTime = nil
        dismiss()
    }
    
    private func handleEmotionalEvent(_ event: EmotionalEvent) {
        detectedEvents.append(event)
        
        // Show toast notification
        let emotionName = event.emotionType.rawValue.capitalized
        if let transcript = event.transcript, !transcript.isEmpty {
            toastMessage = "\(emotionName) moment: \(transcript.prefix(40))"
        } else {
            toastMessage = "\(emotionName) moment captured!"
        }
        
        withAnimation {
            showToast = true
        }
        
        // Hide toast after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            withAnimation {
                showToast = false
            }
        }
        
        // Save to memory store
        saveEmotionalMemory(event: event)
    }
    
    private func saveEmotionalMemory(event: EmotionalEvent) {
        var details: [String: AnyCodable] = [
            "emotionType": AnyCodable(event.emotionType.rawValue),
            "confidence": AnyCodable(event.confidence)
        ]
        
        if let transcript = event.transcript {
            details["transcript"] = AnyCodable(transcript)
        }
        
        if let audioURL = event.audioURL {
            details["audioURL"] = AnyCodable(audioURL.absoluteString)
        }
        
        // Build summary (already includes emotion from service)
        let summary: String
        if let transcript = event.transcript, !transcript.isEmpty {
            summary = "\(event.emotionType.rawValue.capitalized) moment: you said \"\(transcript)\""
        } else {
            summary = "\(event.emotionType.rawValue.capitalized) moment detected"
        }
        
        let entry = MemoryEntry(
            kind: .emotional,
            startTime: event.timestamp,
            endTime: event.timestamp.addingTimeInterval(10), // 10-second event window
            latitude: event.location?.coordinate.latitude,
            longitude: event.location?.coordinate.longitude,
            activityType: .stationary, // Emotional capture is typically stationary
            summary: summary,
            details: details
        )
        
        do {
            try memoryStore.add(entry)
        } catch {
            print("Error saving emotional memory: \(error)")
        }
    }
    
    private func elapsedTimeString(from startTime: Date) -> String {
        let elapsed = Date().timeIntervalSince(startTime)
        let hours = Int(elapsed) / 3600
        let minutes = (Int(elapsed) % 3600) / 60
        let seconds = Int(elapsed) % 60
        
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%d:%02d", minutes, seconds)
        }
    }
}

/// Toast notification view
struct ToastView: View {
    let message: String
    
    var body: some View {
        Text(message)
            .font(.subheadline)
            .foregroundColor(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(Color.black.opacity(0.8))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.3), radius: 10, x: 0, y: 5)
    }
}

