import SwiftUI

/// Timeline view showing MemoryEntry objects for today, grouped by time
struct TodayView: View {
    @EnvironmentObject var memoryStore: InMemoryMemoryStore
    @State private var todayMemories: [MemoryEntry] = []
    @State private var showEmotionalSession = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 16) {
                    // Prominent Start Emotional Capture button
                    Button {
                        showEmotionalSession = true
                    } label: {
                        HStack {
                            Image(systemName: "heart.fill")
                                .font(.title2)
                            Text("Start Emotional Capture")
                                .font(.headline)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                        }
                        .foregroundColor(.white)
                        .padding()
                        .background(
                            LinearGradient(
                                colors: [Color.red, Color.pink],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(12)
                        .shadow(color: Color.red.opacity(0.3), radius: 5, x: 0, y: 2)
                    }
                    .padding(.horizontal)
                    .padding(.top)
                    
                    if todayMemories.isEmpty {
                        EmptyStateView()
                    } else {
                        // Group memories by time periods
                        ForEach(groupedMemories, id: \.key) { group in
                            TimeGroupView(timeRange: group.key, memories: group.value)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Today")
            .sheet(isPresented: $showEmotionalSession) {
                EmotionalSessionView()
            }
            .onAppear {
                loadTodayMemories()
            }
            .onChange(of: memoryStore.memories) { _ in
                loadTodayMemories()
            }
        }
    }
    
    /// Group memories by time periods (hour blocks)
    private var groupedMemories: [(key: String, value: [MemoryEntry])] {
        let calendar = Calendar.current
        let grouped = Dictionary(grouping: todayMemories) { memory in
            let hour = calendar.component(.hour, from: memory.startTime)
            return "\(hour):00 - \(hour + 1):00"
        }
        return grouped.sorted { $0.key > $1.key }
    }
    
    private func loadTodayMemories() {
        todayMemories = memoryStore.memories(forDay: Date())
            .sorted { $0.startTime > $1.startTime }
    }
}

/// View for displaying a group of memories within a time range
struct TimeGroupView: View {
    let timeRange: String
    let memories: [MemoryEntry]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(timeRange)
                .font(.headline)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            ForEach(memories) { memory in
                MemoryEntryRow(memory: memory)
            }
        }
    }
}

/// Row view for a single MemoryEntry showing required fields
struct MemoryEntryRow: View {
    let memory: MemoryEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Time range
            HStack {
                Text(timeRangeString)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                // Activity type badge
                if memory.activityType != .unknown {
                    Text(memory.activityType.rawValue.capitalized)
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }
            }
            
            // Summary
            Text(memory.summary)
                .font(.body)
            
            // Place name if available
            if let placeName = memory.placeName {
                HStack {
                    Image(systemName: "location.fill")
                        .font(.caption)
                    Text(placeName)
                        .font(.caption)
                }
                .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
    
    private var timeRangeString: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        
        let startTime = formatter.string(from: memory.startTime)
        
        if let endTime = memory.endTime {
            let endTimeString = formatter.string(from: endTime)
            return "\(startTime) - \(endTimeString)"
        } else {
            return startTime
        }
    }
}

/// Empty state view when no memories exist for today
struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "clock.badge.questionmark")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            Text("No memories yet")
                .font(.title2)
                .foregroundColor(.secondary)
            Text("Your timeline will appear here as Mnemo logs your day")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}
