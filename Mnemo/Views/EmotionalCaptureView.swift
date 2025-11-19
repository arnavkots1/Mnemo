import SwiftUI
import Combine

struct EmotionalCaptureView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss
    @State private var isRecording = false
    @State private var detectedEvents: [EmotionalEvent] = []
    @State private var sessionStartTime: Date?
    
    var body: some View {
        VStack(spacing: 40) {
            // Header
            HStack {
                Button("End Session") {
                    endSession()
                }
                .foregroundColor(.red)
                Spacer()
            }
            .padding()
            
            Spacer()
            
            // Main content
            VStack(spacing: 30) {
                // Mic icon
                Image(systemName: isRecording ? "mic.fill" : "mic.slash.fill")
                    .font(.system(size: 80))
                    .foregroundColor(isRecording ? .red : .gray)
                    .animation(.easeInOut, value: isRecording)
                
                // Status text
                if isRecording {
                    VStack(spacing: 8) {
                        Text("Listening for emotional moments...")
                            .font(.headline)
                        
                        if let startTime = sessionStartTime {
                            Text("Session: \(elapsedTimeString(from: startTime))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                } else {
                    Text("Tap Start to begin capturing")
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
                
                // Start/Stop button
                Button(action: {
                    if isRecording {
                        endSession()
                    } else {
                        startSession()
                    }
                }) {
                    Text(isRecording ? "Stop Session" : "Start Session")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.horizontal, 40)
                        .padding(.vertical, 16)
                        .background(isRecording ? Color.red : Color.blue)
                        .cornerRadius(12)
                }
            }
            
            // Detected events list
            if !detectedEvents.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Detected Events")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    ScrollView {
                        ForEach(Array(detectedEvents.enumerated()), id: \.offset) { index, event in
                            EmotionalEventRow(event: event)
                        }
                    }
                    .frame(maxHeight: 200)
                }
                .padding()
            }
            
            Spacer()
            
            // Instructions
            VStack(spacing: 8) {
                Text("Keep this screen open during the session")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("Emotional moments will be captured automatically")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .onAppear {
            setupSubscriptions()
        }
        .onDisappear {
            if isRecording {
                endSession()
            }
        }
    }
    
    private func setupSubscriptions() {
        // Subscribe to emotional events
        appState.emotionalCaptureService?.emotionalEventPublisher
            .sink { [weak self] event in
                DispatchQueue.main.async {
                    self?.detectedEvents.append(event)
                    self?.saveEmotionalMemory(event: event)
                }
            }
            .store(in: &cancellables)
    }
    
    private var cancellables = Set<AnyCancellable>()
    
    private func startSession() {
        Task {
            do {
                try await appState.emotionalCaptureService?.startSession()
                await MainActor.run {
                    isRecording = true
                    sessionStartTime = Date()
                    detectedEvents = []
                }
            } catch {
                print("Error starting session: \(error)")
                // Show error alert
            }
        }
    }
    
    private func endSession() {
        appState.emotionalCaptureService?.stopSession()
        isRecording = false
        sessionStartTime = nil
        dismiss()
    }
    
    private func saveEmotionalMemory(event: EmotionalEvent) {
        guard let store = appState.memoryStore else { return }
        
        var details: [String: AnyCodable] = [
            "emotionType": AnyCodable(event.emotionType),
            "confidence": AnyCodable(event.confidence)
        ]
        
        if let transcript = event.transcript {
            details["transcript"] = AnyCodable(transcript)
        }
        
        if let audioURL = event.audioURL {
            details["audioURL"] = AnyCodable(audioURL.absoluteString)
        }
        
        let entry = MemoryEntry(
            kind: .emotional,
            startTime: event.timestamp,
            summary: "Emotional moment: \(event.emotionType)",
            details: details
        )
        
        do {
            try store.save(entry)
            appState.loadMemories()
        } catch {
            print("Error saving emotional memory: \(error)")
        }
    }
    
    private func elapsedTimeString(from startTime: Date) -> String {
        let elapsed = Date().timeIntervalSince(startTime)
        let minutes = Int(elapsed) / 60
        let seconds = Int(elapsed) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

struct EmotionalEventRow: View {
    let event: EmotionalEvent
    
    var body: some View {
        HStack {
            Image(systemName: "heart.fill")
                .foregroundColor(.red)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(event.emotionType.capitalized)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let transcript = event.transcript {
                    Text(transcript)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
            }
            
            Spacer()
            
            Text(timeString(from: event.timestamp))
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
    
    private func timeString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

