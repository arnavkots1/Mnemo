import Foundation
import Photos
import UIKit
import CoreLocation
import PhotosUI

/// Protocol for importing user-selected photos
/// Uses scoped access via PHPickerViewController - no full library permission required
protocol PhotoImportService {
    /// Process PhotosPicker items and create memory entries
    /// This uses scoped access - no full photo library permission needed
    func processPhotoPickerItems(_ items: [PhotosPickerItem]) async throws -> [MemoryEntry]
    
    /// Load thumbnail image for a photo identifier
    /// Uses PHImageManager to load image from local identifier
    func loadThumbnail(for identifier: String, targetSize: CGSize) async -> UIImage?
}

/// Implementation using Photos framework
/// Note: Uses scoped access via PHPickerViewController - does NOT request full photo library access
class PHPhotoImportService: PhotoImportService {
    private let memoryStore: MemoryStore
    
    init(memoryStore: MemoryStore) {
        self.memoryStore = memoryStore
    }
    
    func processPhotoPickerItems(_ items: [PhotosPickerItem]) async throws -> [MemoryEntry] {
        var entries: [MemoryEntry] = []
        
        for item in items {
            // Extract identifier from PhotosPickerItem
            guard let identifier = item.identifier else {
                continue
            }
            
            // Fetch PHAsset using the identifier
            // Note: This works because PHPickerViewController provides scoped access
            let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil)
            guard let asset = fetchResult.firstObject else {
                continue
            }
            
            // Extract metadata from asset
            let creationDate = asset.creationDate ?? Date()
            let location = asset.location
            
            // TODO: Future enhancement - Vision Model Integration
            // At this point, we could call a vision model (e.g., Core ML Vision or Vision API)
            // to generate an automatic caption for the photo.
            //
            // Example implementation:
            //   let image = await loadImageData(from: asset)
            //   let caption = await visionModel.generateCaption(for: image)
            //   let summary = caption ?? "Photo moment"
            //
            // This would replace the generic "Photo moment" summary with something more
            // descriptive like "A person walking on a beach at sunset" or "Group of friends
            // laughing at a restaurant table"
            
            // Create memory entry
            let entry = MemoryEntry(
                kind: .photo,
                startTime: creationDate,
                endTime: nil,
                latitude: location?.coordinate.latitude,
                longitude: location?.coordinate.longitude,
                summary: "Photo moment", // Will be updated with vision model caption in future
                details: [
                    "photoIdentifier": AnyCodable(asset.localIdentifier),
                    "mediaType": AnyCodable(asset.mediaType.rawValue)
                ]
            )
            
            entries.append(entry)
            
            // Save to store
            try memoryStore.add(entry)
        }
        
        return entries
    }
    
    func loadThumbnail(for identifier: String, targetSize: CGSize) async -> UIImage? {
        guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil).firstObject else {
            return nil
        }
        
        return await withCheckedContinuation { continuation in
            let options = PHImageRequestOptions()
            options.deliveryMode = .opportunistic // Fast, may be lower quality
            options.resizeMode = .fast
            options.isSynchronous = false
            
            PHImageManager.default().requestImage(
                for: asset,
                targetSize: targetSize,
                contentMode: .aspectFill,
                options: options
            ) { image, _ in
                continuation.resume(returning: image)
            }
        }
    }
}
