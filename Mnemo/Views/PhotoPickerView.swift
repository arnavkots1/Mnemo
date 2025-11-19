import SwiftUI
import PhotosUI

struct PhotoPickerView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var isProcessing = false
    
    var body: some View {
        NavigationView {
            VStack {
                if isProcessing {
                    ProgressView("Processing photos...")
                        .padding()
                } else {
                    PhotosPicker(
                        selection: $selectedItems,
                        maxSelectionCount: 10,
                        matching: .images
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
                }
            }
            .navigationTitle("Add Photo Moments")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .onChange(of: selectedItems) { items in
                processSelectedPhotos(items)
            }
        }
    }
    
    private func processSelectedPhotos(_ items: [PhotosPickerItem]) {
        guard !items.isEmpty, let photoService = appState.photoImportService else { return }
        
        isProcessing = true
        
        Task {
            do {
                // Process photos using PhotosPicker items directly
                let entries = try await photoService.processPhotoPickerItems(items)
                
                await MainActor.run {
                    appState.loadMemories()
                    isProcessing = false
                    dismiss()
                }
            } catch {
                print("Error processing photos: \(error)")
                await MainActor.run {
                    isProcessing = false
                }
            }
        }
    }
}

