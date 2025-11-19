# Photo Moments Implementation

## Overview

The Photo Moments feature allows users to import photos from their library and create `.photo` MemoryEntry objects. It uses scoped access via PHPickerViewController, requiring no full photo library permission.

## Importing Photos

### UI Integration

**MomentsView**:
- **"Import from Photos" button** at the top of the view
- Prominent blue button with icon
- Opens photo picker when tapped

**PhotoPickerSheet**:
- SwiftUI wrapper using `PhotosPicker`
- Configured for:
  - **Multi-selection**: Unlimited (selectionLimit: 0)
  - **Photos only**: `.images` filter (no videos)
  - **Scoped access**: No full library permission required

### Photo Processing

When photos are selected:

1. **Extract Metadata**:
   - Creation date/time from `PHAsset.creationDate`
   - Location metadata from `PHAsset.location` (if available)
   - Local identifier for later image retrieval

2. **Create MemoryEntry**:
   ```swift
   MemoryEntry(
       kind: .photo,
       startTime: creationDate,
       endTime: nil,
       latitude: location?.coordinate.latitude,
       longitude: location?.coordinate.longitude,
       summary: "Photo moment", // Will be updated with vision model caption
       details: [
           "photoIdentifier": asset.localIdentifier,
           "mediaType": asset.mediaType.rawValue
       ]
   )
   ```

3. **Save to MemoryStore**: Entry is immediately saved

## Displaying Photos

### MomentsView Layout

- Shows `.photo` and `.emotional` MemoryEntries together
- **Reverse chronological order** (most recent first)
- Different card types for each kind

### PhotoMomentCard

**Features**:
- **Thumbnail image** loaded via `PHImageManager`
- **Metadata display**: Date/time, summary
- **Location display**: Place name if available
- **Loading state**: Progress indicator while thumbnail loads

**Thumbnail Loading**:
- Uses `PHImageManager.requestImage()` with:
  - Target size: 400x400 (2x for retina)
  - Delivery mode: `.opportunistic` (fast, may be lower quality)
  - Resize mode: `.fast`
- Loads asynchronously to avoid blocking UI

### EmotionalMomentCard

**Features**:
- **Icon**: Waveform path icon (red)
- **Summary text**: Full emotional moment summary
- **Transcript**: If available, shown in italic
- **Location**: Place name if available

## Future Vision Model Integration

### Location in Code

The vision model integration point is clearly marked in `PhotoImportService.processPhotoPickerItems()`:

```swift
// TODO: Future enhancement - Vision Model Integration
// At this point, we could call a vision model (e.g., Core ML Vision or Vision API)
// to generate an automatic caption for the photo.
//
// Example implementation:
//   let image = await loadImageData(from: asset)
//   let caption = await visionModel.generateCaption(for: image)
//   let summary = caption ?? "Photo moment"
```

### Implementation Notes

When implementing vision model captioning:

1. **Load image data** from PHAsset
2. **Run vision model** inference (Core ML or API)
3. **Generate caption** describing the photo
4. **Update summary** from "Photo moment" to generated caption
5. **Fallback**: Use "Photo moment" if caption generation fails

### Example Captions

Vision model could generate captions like:
- "A person walking on a beach at sunset"
- "Group of friends laughing at a restaurant table"
- "City skyline at night with lights"
- "Close-up of a flower in a garden"

## Privacy & Permissions

### Scoped Access

**Key Feature**: Uses PHPickerViewController with scoped access
- **No full library permission** required
- User selects specific photos only
- App only sees selected photos, not entire library
- More privacy-friendly than requesting full access

### Info.plist

**No photo library permission needed** for PHPickerViewController!

However, if you later need to access photos without user selection (e.g., for background processing), you would need:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Mnemo needs photo library access to import photos you select as moments.</string>
```

But for the current implementation, **no permission entry is required** because we use scoped access.

## Architecture

### PhotoImportService

**Protocol**:
- `processPhotoPickerItems(_:)` - Process selected photos
- `loadThumbnail(for:targetSize:)` - Load thumbnail images

**Implementation**:
- Uses `PHAsset` to access photo metadata
- Stores local identifier for later retrieval
- Handles async image loading

### MemoryEntry Structure

Photo entries include:
- **startTime**: Photo creation date
- **endTime**: nil (photos are point-in-time)
- **latitude/longitude**: From photo EXIF data
- **summary**: "Photo moment" (or vision-generated caption)
- **details**: Contains `photoIdentifier` for image retrieval

## Testing Considerations

- Can test with mock PHAsset objects
- Thumbnail loading can be tested with sample images
- Vision model integration can be stubbed for testing
- No actual photo library access needed for unit tests

## Future Enhancements

1. **Vision Model Integration**:
   - Automatic caption generation
   - Object detection
   - Scene classification

2. **Photo Editing**:
   - Crop/rotate imported photos
   - Apply filters

3. **Batch Import**:
   - Import multiple photos at once
   - Progress indicator for large batches

4. **Photo Organization**:
   - Group photos by date/location
   - Search photos by caption/content

5. **Share Extension**:
   - Import photos from other apps
   - Quick add from Photos app

