/**
 * PhotoService - Handles photo import and memory creation
 * 
 * Uses expo-image-picker to select photos and create photo memory entries
 * with EXIF metadata extraction (creation date, GPS coordinates).
 */

import * as ImagePicker from 'expo-image-picker';
import { MemoryEntry, createMemoryEntry } from '../types/MemoryEntry';
import { enhanceMemoryWithContext, getTimeOfDay, getDayOfWeek } from './memoryGenerator';
import { analyzeImage, configureImageAnalysis } from './imageAnalysisService';

/**
 * Pick photos and create memory entries
 * 
 * Launches image picker, extracts EXIF metadata, and creates MemoryEntry
 * objects for each selected photo.
 */
export async function pickPhotosAndCreateMemories(): Promise<MemoryEntry[]> {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Photo library permission not granted');
    }
    
    // Launch image picker with multiple selection support
    // Using MediaTypeOptions (works reliably across SDK versions)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Photos only
      allowsMultipleSelection: true, // Allow multiple photos
      quality: 0.8, // Good quality without being too large
      allowsEditing: false, // Don't allow editing
      exif: true, // Request EXIF data including GPS
    });
    
    if (result.canceled) {
      return [];
    }
    
    // Process each selected photo
    const memories: MemoryEntry[] = [];
    
    for (const asset of result.assets) {
      // Extract creation date from EXIF or use current date
      let creationDate: Date | null = null;
      
      // Log available EXIF data for debugging
      console.log('📸 Photo EXIF data:', {
        creationTime: asset.creationTime,
        exif: asset.exif ? {
          DateTimeOriginal: asset.exif.DateTimeOriginal,
          DateTime: asset.exif.DateTime,
          DateTimeDigitized: asset.exif.DateTimeDigitized,
        } : 'none',
      });
      
      // Try asset.creationTime first (most reliable)
      if (asset.creationTime) {
        try {
          let dateValue: number;
          if (typeof asset.creationTime === 'number') {
            // Check if it's seconds (Unix timestamp < year 2000) or milliseconds
            // Unix timestamp for 2000-01-01 is 946684800 (seconds) or 946684800000 (milliseconds)
            if (asset.creationTime < 946684800) {
              // Seconds since epoch
              dateValue = asset.creationTime * 1000;
            } else if (asset.creationTime < 946684800000) {
              // Already milliseconds but before 2000 (unlikely but possible)
              dateValue = asset.creationTime;
            } else {
              // Milliseconds since epoch
              dateValue = asset.creationTime;
            }
          } else {
            // String - try parsing
            const parsed = parseFloat(String(asset.creationTime));
            if (parsed < 946684800) {
              dateValue = parsed * 1000; // Seconds
            } else {
              dateValue = parsed; // Milliseconds
            }
          }
          
          if (!isNaN(dateValue) && dateValue > 0) {
            const parsedDate = new Date(dateValue);
            if (!isNaN(parsedDate.getTime())) {
              const now = Date.now();
              const yearDiff = Math.abs(parsedDate.getTime() - now) / (1000 * 60 * 60 * 24 * 365);
              // Only use if date is reasonable (not more than 50 years in past, not in future)
              if (yearDiff < 50 && parsedDate.getTime() <= now) {
                creationDate = parsedDate;
                console.log(`✅ Using creationTime: ${creationDate.toISOString()}`);
              } else {
                console.warn(`⚠️ creationTime out of range: ${parsedDate.toISOString()}, diff: ${yearDiff.toFixed(1)} years`);
              }
            }
          }
        } catch (error) {
          console.warn('Error parsing creationTime:', error);
        }
      }
      
      // Try EXIF DateTimeOriginal if creationTime didn't work
      if (!creationDate && asset.exif?.DateTimeOriginal) {
        try {
          const exifStr = String(asset.exif.DateTimeOriginal);
          console.log(`Trying to parse EXIF DateTimeOriginal: "${exifStr}"`);
          
          // EXIF DateTimeOriginal format: "YYYY:MM:DD HH:MM:SS"
          // Try multiple parsing methods
          let exifDate: Date | null = null;
          
          // Method 1: Replace colons and space with ISO format
          const isoStr = exifStr.replace(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3T$4:$5:$6');
          exifDate = new Date(isoStr);
          
          // Method 2: If that failed, try direct parsing
          if (isNaN(exifDate.getTime())) {
            exifDate = new Date(exifStr);
          }
          
          if (!isNaN(exifDate.getTime())) {
            const now = Date.now();
            const yearDiff = Math.abs(exifDate.getTime() - now) / (1000 * 60 * 60 * 24 * 365);
            // Only use if date is reasonable (not more than 50 years in past, not in future)
            if (yearDiff < 50 && exifDate.getTime() <= now) {
              creationDate = exifDate;
              console.log(`✅ Using EXIF DateTimeOriginal: ${creationDate.toISOString()}`);
            } else {
              console.warn(`⚠️ EXIF DateTimeOriginal out of range: ${exifDate.toISOString()}, diff: ${yearDiff.toFixed(1)} years`);
            }
          } else {
            console.warn(`⚠️ Failed to parse EXIF DateTimeOriginal: "${exifStr}"`);
          }
        } catch (error) {
          console.warn('Error parsing EXIF DateTimeOriginal:', error);
        }
      }
      
      // Try other EXIF date fields as fallback
      if (!creationDate && asset.exif) {
        const dateFields = ['DateTime', 'DateTimeDigitized'];
        for (const field of dateFields) {
          if (asset.exif[field as keyof typeof asset.exif]) {
            try {
              const exifStr = String(asset.exif[field as keyof typeof asset.exif]);
              const isoStr = exifStr.replace(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3T$4:$5:$6');
              const exifDate = new Date(isoStr);
              if (!isNaN(exifDate.getTime())) {
                const now = Date.now();
                const yearDiff = Math.abs(exifDate.getTime() - now) / (1000 * 60 * 60 * 24 * 365);
                if (yearDiff < 50 && exifDate.getTime() <= now) {
                  creationDate = exifDate;
                  console.log(`✅ Using EXIF ${field}: ${creationDate.toISOString()}`);
                  break;
                }
              }
            } catch (error) {
              // Continue to next field
            }
          }
        }
      }
      
      // Fallback to current date if all parsing failed
      if (!creationDate) {
        creationDate = new Date();
        console.warn('⚠️ Using current date (all EXIF parsing failed)');
      }
      
      // Extract GPS coordinates from EXIF if available
      let latitude: number | undefined;
      let longitude: number | undefined;
      
      if (asset.location) {
        // Location from asset metadata (preferred)
        latitude = asset.location.latitude;
        longitude = asset.location.longitude;
      } else if (asset.exif?.GPSLatitude && asset.exif?.GPSLongitude) {
        // Fallback to EXIF GPS data
        latitude = asset.exif.GPSLatitude as number;
        longitude = asset.exif.GPSLongitude as number;
      }
      
      // Log creation date for debugging
      console.log(`Photo creation date: ${creationDate.toISOString()}, Time of day: ${getTimeOfDay(creationDate)}`);
      
      // Analyze image using backend (or local fallback)
      let summary = 'Photo moment';
      let description = 'A memorable moment captured';
      
      try {
        const timeOfDay = getTimeOfDay(creationDate);
        const dayOfWeek = getDayOfWeek(creationDate);
        
        console.log(`Analyzing image with timeOfDay: ${timeOfDay}, dayOfWeek: ${dayOfWeek}`);
        
        const analysis = await analyzeImage({
          imageUri: asset.uri,
          location: latitude && longitude ? {
            latitude,
            longitude,
            placeName: undefined, // Will be set after reverse geocoding if needed
          } : undefined,
          timeOfDay: timeOfDay, // Use photo's actual creation time
          dayOfWeek: dayOfWeek,
        });
        
        summary = analysis.summary;
        description = analysis.description;
        
        console.log(`Image analysis result: ${summary}`);
      } catch (error) {
        console.warn('Image analysis failed, using local fallback:', error);
        // Fallback to local generation
        const enhanced = enhanceMemoryWithContext(
          createMemoryEntry('photo', 'Photo moment', {
            startTime: creationDate,
            latitude,
            longitude,
          })
        );
        summary = enhanced.summary;
      }
      
      // Create memory entry with analyzed summary
      const memory = createMemoryEntry('photo', summary, {
        startTime: creationDate,
        latitude,
        longitude,
        details: {
          uri: asset.uri, // Local URI for the photo
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          exif: asset.exif, // Store raw EXIF data
          description, // Store AI-generated description
        },
      });
      
      memories.push(memory);
    }
    
    return memories;
  } catch (error) {
    console.error('Error picking photos:', error);
    throw error;
  }
}

