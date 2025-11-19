/**
 * PhotoImportService - Handles importing user-selected photos
 * 
 * Uses expo-image-picker with scoped access (user selects photos only).
 */

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MemoryEntry, createMemoryEntry } from '../types/MemoryEntry';
import { memoryStore } from '../store/MemoryStore';
import { locationService } from './LocationService';

export interface PhotoImportService {
  /**
   * Request photo library permissions
   */
  requestPermissions(): Promise<boolean>;
  
  /**
   * Pick photos and create memory entries
   */
  pickAndImportPhotos(): Promise<MemoryEntry[]>;
}

/**
 * Implementation using expo-image-picker
 */
class ExpoPhotoImportService implements PhotoImportService {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting photo permissions:', error);
      return false;
    }
  }
  
  async pickAndImportPhotos(): Promise<MemoryEntry[]> {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Photo library permission not granted');
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,  // Photos only, no videos
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      
      if (result.canceled) {
        return [];
      }
      
      // Process each selected photo
      const entries: MemoryEntry[] = [];
      
      for (const asset of result.assets) {
        // Extract metadata
        const creationDate = asset.creationTime
          ? new Date(asset.creationTime)
          : new Date();
        
        // Get location if available
        let latitude: number | undefined;
        let longitude: number | undefined;
        let placeName: string | undefined;
        
        if (asset.location) {
          latitude = asset.location.latitude;
          longitude = asset.location.longitude;
          
          // Reverse geocode for place name
          placeName = await locationService.reverseGeocode(
            latitude,
            longitude
          ) || undefined;
        }
        
        // TODO: Future enhancement - Vision Model Integration
        // At this point, we could call a vision model (e.g., via API)
        // to generate an automatic caption for the photo.
        //
        // Example implementation:
        //   const caption = await visionModel.generateCaption(for: asset.uri)
        //   const summary = caption || "Photo moment"
        //
        // This would replace the generic "Photo moment" summary with something more
        // descriptive like "A person walking on a beach at sunset"
        
        // Create memory entry
        const entry = createMemoryEntry('photo', 'Photo moment', {
          startTime: creationDate,
          latitude,
          longitude,
          placeName,
          details: {
            photoUri: asset.uri,
            width: asset.width,
            height: asset.height,
            fileName: asset.fileName,
          },
        });
        
        entries.push(entry);
        
        // Save to store
        await memoryStore.add(entry);
      }
      
      return entries;
    } catch (error) {
      console.error('Error importing photos:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const photoImportService: PhotoImportService = new ExpoPhotoImportService();

