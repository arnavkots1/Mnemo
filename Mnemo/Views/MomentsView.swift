import SwiftUI
import PhotosUI

/// View showing emotional and photo memories in reverse chronological order
struct MomentsView: View {
    @EnvironmentObject var memoryStore: InMemoryMemoryStore
    @State private var moments: [MemoryEntry] = []
    @State private var showPhotoPicker = false
    @State private var selectedItems: [PhotosPickerItem] = []
    
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 16) {
                    // Import from Photos button at the top
                    Button {
                        showPhotoPicker = true
                    } label: {
                        HStack {
                            Image(systemName: "photo.on.rectangle")
                                .font(.title3)
                            Text("Import from Photos")
                                .font(.headline)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                        }
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(12)
                        .shadow(color: Color.blue.opacity(0.3), radius: 5, x: 0, y: 2)
                    }
                    .padding(.horizontal)
                    .padding(.top)
                    
                    if moments.isEmpty {
                        EmptyMomentsView()
                    } else {
                        ForEach(moments) { memory in
                            if memory.kind == .photo {
                                PhotoMomentCard(memory: memory)
                            } else {
                                EmotionalMomentCard(memory: memory)
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Moments")
            .sheet(isPresented: $showPhotoPicker) {
                PhotoPickerSheet(selectedItems: $selectedItems)
            }
            .onAppear {
                loadMoments()
            }
            .onChange(of: memoryStore.memories) { _ in
                loadMoments()
            }
            .onChange(of: selectedItems) { items in
                if !items.isEmpty {
                    processSelectedPhotos(items)
                }
            }
        }
    }
    
    private func loadMoments() {
        // Filter for .emotional and .photo memories
        let allMemories = memoryStore.memories
        moments = allMemories
            .filter { $0.kind == .emotional || $0.kind == .photo }
            .sorted { $0.startTime > $1.startTime } // Reverse chronological order
    }
    
    private func processSelectedPhotos(_ items: [PhotosPickerItem]) {
        Task {
            do {
                // Create a temporary service instance with the current memory store
                let service = PHPhotoImportService(memoryStore: memoryStore)
                _ = try await service.processPhotoPickerItems(items)
                
                // Clear selection
                await MainActor.run {
                    selectedItems = []
                    loadMoments()
                }
            } catch {
                print("Error processing photos: \(error)")
            }
        }
    }
}

/// Card view for displaying a photo moment with thumbnail
struct PhotoMomentCard: View {
    let memory: MemoryEntry
    @EnvironmentObject var memoryStore: InMemoryMemoryStore
    @State private var thumbnail: UIImage?
    @State private var isLoading = true
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Thumbnail image
            if let thumbnail = thumbnail {
                Image(uiImage: thumbnail)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(height: 200)
                    .clipped()
                    .cornerRadius(12)
            } else if isLoading {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 200)
                    .cornerRadius(12)
                    .overlay {
                        ProgressView()
                    }
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 200)
                    .cornerRadius(12)
                    .overlay {
                        Image(systemName: "photo")
                            .font(.largeTitle)
                            .foregroundColor(.gray)
                    }
            }
            
            // Metadata
            HStack {
                Image(systemName: "photo.fill")
                    .foregroundColor(.purple)
                
                Text(dateString(from: memory.startTime))
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
            }
            
            // Summary
            Text(memory.summary)
                .font(.body)
            
            // Location if available
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
        .onAppear {
            loadThumbnail()
        }
    }
    
    private func loadThumbnail() {
        guard let identifier = memory.details["photoIdentifier"]?.value as? String else {
            isLoading = false
            return
        }
        
        Task {
            // Load thumbnail at appropriate size for display
            let targetSize = CGSize(width: 400, height: 400) // 2x for retina
            let service = PHPhotoImportService(memoryStore: memoryStore)
            let image = await service.loadThumbnail(for: identifier, targetSize: targetSize)
            
            await MainActor.run {
                self.thumbnail = image
                self.isLoading = false
            }
        }
    }
    
    private func dateString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

/// Card view for displaying an emotional moment
struct EmotionalMomentCard: View {
    let memory: MemoryEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                // Icon (waveform or face)
                Image(systemName: "waveform.path")
                    .foregroundColor(.red)
                    .font(.title2)
                
                Text(dateString(from: memory.startTime))
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
            }
            
            // Summary text
            Text(memory.summary)
                .font(.body)
            
            // Transcript if available
            if let transcript = memory.details["transcript"]?.value as? String {
                Text(transcript)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .italic()
                    .lineLimit(3)
            }
            
            // Location if available
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
    
    private func dateString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

/// Empty state view when no moments exist
struct EmptyMomentsView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "photo.on.rectangle")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            Text("No moments yet")
                .font(.title2)
                .foregroundColor(.secondary)
            Text("Emotional and photo moments will appear here")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}

/// SwiftUI wrapper for PHPickerViewController using PhotosPicker
/// Uses scoped access - no full photo library permission required
struct PhotoPickerSheet: View {
    @Binding var selectedItems: [PhotosPickerItem]
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                PhotosPicker(
                    selection: $selectedItems,
                    maxSelectionCount: 0, // 0 = unlimited selection
                    matching: .images // Photos only, no videos
                ) {
                    Label("Select Photos", systemImage: "photo.on.rectangle")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.blue)
                        .cornerRadius(12)
                }
                .padding()
                
                Text("Select photos to add as moments")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding()
                
                Spacer()
            }
            .navigationTitle("Import from Photos")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}
