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
import { createRichMemory, MemoryData } from './memoryAnalyzer';

/**
 * Detect if photo was taken on this phone vs downloaded/received
 * 
 * Uses EXIF metadata to determine photo origin:
 * - Photos taken on phone: Usually have complete EXIF (camera make/model, GPS, DateTimeOriginal)
 * - Photos downloaded/received: Often have EXIF stripped (no camera info, no GPS, no DateTimeOriginal)
 */
function detectPhotoOrigin(
  asset: ImagePicker.ImagePickerAsset,
  assetWithExtras: any,
  exifDate: Date | null,
  creationTime: number | null
): {
  likelyTakenOnPhone: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
} {
  const exif = asset.exif;
  const hasExif = !!exif;
  
  // Check for camera make/model (strong indicator of phone-captured photo)
  const hasCameraInfo = !!(exif?.Make || exif?.Model);
  
  // Check for GPS data (photos taken on phone often have GPS if location services enabled)
  const hasGPS = !!(exif?.GPSLatitude && exif?.GPSLongitude) || !!(assetWithExtras.location);
  
  // Check for camera settings (ISO, Aperture, etc.) - indicates original photo
  const hasCameraSettings = !!(exif?.ISO || exif?.FNumber || exif?.ExposureTime);
  
  // Check if DateTimeOriginal exists and is reasonable
  const hasDateTimeOriginal = !!exif?.DateTimeOriginal;
  
  // Check if DateTimeOriginal matches creationTime (within 1 hour)
  // If they're very different, photo might be downloaded
  let dateTimeMatches = false;
  if (exifDate && creationTime) {
    const exifTime = exifDate.getTime();
    const creationTimeMs = typeof creationTime === 'number' 
      ? (creationTime < 946684800000 ? creationTime * 1000 : creationTime)
      : null;
    if (creationTimeMs) {
      const timeDiff = Math.abs(exifTime - creationTimeMs);
      const oneHour = 60 * 60 * 1000;
      dateTimeMatches = timeDiff < oneHour;
    }
  }
  
  // Scoring system
  let score = 0;
  const reasons: string[] = [];
  
  if (hasDateTimeOriginal) {
    score += 3;
    reasons.push('has DateTimeOriginal');
  }
  
  if (hasCameraInfo) {
    score += 3;
    reasons.push('has camera make/model');
  }
  
  if (hasGPS) {
    score += 2;
    reasons.push('has GPS location');
  }
  
  if (hasCameraSettings) {
    score += 2;
    reasons.push('has camera settings');
  }
  
  if (dateTimeMatches) {
    score += 1;
    reasons.push('DateTimeOriginal matches save time');
  }
  
  // If EXIF is completely missing or minimal, likely downloaded
  if (!hasExif || (!hasDateTimeOriginal && !hasCameraInfo && !hasGPS)) {
    score = Math.max(0, score - 5);
    reasons.push('EXIF data missing or minimal (likely downloaded/received)');
  }
  
  // Determine result
  let likelyTakenOnPhone: boolean;
  let confidence: 'high' | 'medium' | 'low';
  
  if (score >= 7) {
    likelyTakenOnPhone = true;
    confidence = 'high';
  } else if (score >= 4) {
    likelyTakenOnPhone = true;
    confidence = 'medium';
  } else if (score >= 2) {
    likelyTakenOnPhone = false;
    confidence = 'medium';
  } else {
    likelyTakenOnPhone = false;
    confidence = 'high';
  }
  
  const reason = reasons.length > 0 
    ? reasons.join(', ')
    : 'insufficient metadata';
  
  return {
    likelyTakenOnPhone,
    confidence,
    reason,
  };
}

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
      // Note: creationTime and location may not be in TypeScript types but exist at runtime
      const assetWithExtras = asset as any;
      const creationTime = assetWithExtras.creationTime;
      
      console.log('📸 Photo EXIF data:', {
        creationTime: creationTime,
        exif: asset.exif ? {
          DateTimeOriginal: asset.exif.DateTimeOriginal,
          DateTime: asset.exif.DateTime,
          DateTimeDigitized: asset.exif.DateTimeDigitized,
          Make: asset.exif.Make,
          Model: asset.exif.Model,
          GPSLatitude: asset.exif.GPSLatitude,
          GPSLongitude: asset.exif.GPSLongitude,
        } : 'none',
      });
      
      // Priority: DateTimeOriginal (actual photo capture time) > creationTime (when saved to phone)
      // 
      // IMPORTANT: If photo was sent via messaging apps (WhatsApp, iMessage, etc.), 
      // EXIF data is often STRIPPED. In that case, we fall back to creationTime (when saved).
      // This is expected behavior - we can't get the original capture time if EXIF is missing.
      //
      // Try EXIF DateTimeOriginal FIRST (this is when photo was actually taken)
      if (asset.exif?.DateTimeOriginal) {
        try {
          const exifStr = String(asset.exif.DateTimeOriginal);
          console.log(`📅 Found EXIF DateTimeOriginal: "${exifStr}" (original capture time)`);
          
          // EXIF DateTimeOriginal format: "YYYY:MM:DD HH:MM:SS"
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
              console.log(`✅ Using EXIF DateTimeOriginal (original capture time from camera): ${creationDate.toISOString()}`);
            } else {
              console.warn(`⚠️ EXIF DateTimeOriginal out of range: ${exifDate.toISOString()}, diff: ${yearDiff.toFixed(1)} years`);
            }
          } else {
            console.warn(`⚠️ Failed to parse EXIF DateTimeOriginal: "${exifStr}"`);
          }
        } catch (error) {
          console.warn('Error parsing EXIF DateTimeOriginal:', error);
        }
      } else {
        console.log('📅 No EXIF DateTimeOriginal found - photo may have been downloaded/sent via messaging app (EXIF stripped)');
      }
      
      // Fallback to asset.creationTime (when saved to phone)
      // This happens when:
      // 1. Photo was downloaded from messaging apps (EXIF stripped)
      // 2. Photo was saved from another source without EXIF
      // Note: creationTime may not be in TypeScript types but exists at runtime
      if (!creationDate && creationTime) {
        try {
          console.log(`📅 Using creationTime (when photo was saved to your phone): ${creationTime}`);
          let dateValue: number;
          if (typeof creationTime === 'number') {
            // Check if it's seconds (Unix timestamp < year 2000) or milliseconds
            // Unix timestamp for 2000-01-01 is 946684800 (seconds) or 946684800000 (milliseconds)
            if (creationTime < 946684800) {
              // Seconds since epoch
              dateValue = creationTime * 1000;
            } else if (creationTime < 946684800000) {
              // Already milliseconds but before 2000 (unlikely but possible)
              dateValue = creationTime;
            } else {
              // Milliseconds since epoch
              dateValue = creationTime;
            }
          } else {
            // String - try parsing
            const parsed = parseFloat(String(creationTime));
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
                console.log(`✅ Using creationTime (when saved to phone - EXIF was likely stripped): ${creationDate.toISOString()}`);
                console.log(`ℹ️ Note: This is when you saved the photo, not when it was originally taken.`);
              } else {
                console.warn(`⚠️ creationTime out of range: ${parsedDate.toISOString()}, diff: ${yearDiff.toFixed(1)} years`);
              }
            }
          }
        } catch (error) {
          console.warn('Error parsing creationTime:', error);
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
      
      // Detect photo origin (taken on phone vs downloaded/received)
      const originDetection = detectPhotoOrigin(asset, assetWithExtras, creationDate, creationTime);
      console.log(`📱 Photo origin detection:`, {
        likelyTakenOnPhone: originDetection.likelyTakenOnPhone,
        confidence: originDetection.confidence,
        reason: originDetection.reason,
      });
      
      // If photo was likely downloaded/received and we're using creationTime (save date),
      // warn the user that the date might not be accurate
      if (!originDetection.likelyTakenOnPhone && originDetection.confidence === 'high') {
        console.log(`ℹ️ This photo appears to be downloaded/received (EXIF stripped).`);
        console.log(`   Date shown is when you saved it, not when it was originally taken.`);
      }
      
      // Extract GPS coordinates from EXIF if available
      // Note: location may not be in TypeScript types but exists at runtime
      let latitude: number | undefined;
      let longitude: number | undefined;
      
      const assetLocation = assetWithExtras.location;
      if (assetLocation) {
        // Location from asset metadata (preferred)
        latitude = assetLocation.latitude;
        longitude = assetLocation.longitude;
      } else if (asset.exif?.GPSLatitude && asset.exif?.GPSLongitude) {
        // Fallback to EXIF GPS data
        latitude = asset.exif.GPSLatitude as number;
        longitude = asset.exif.GPSLongitude as number;
      }
      
      // Log creation date for debugging
      console.log(`Photo creation date: ${creationDate.toISOString()}, Time of day: ${getTimeOfDay(creationDate)}`);
      console.log(`📷 Photo URI: ${asset.uri}`);
      console.log(`📷 Photo dimensions: ${asset.width}x${asset.height}`);
      
      // Use Gemini AI analysis via memoryAnalyzer (PRIMARY METHOD)
      // This provides rich, meaningful descriptions instead of generic "Morning photo"
      try {
        const memoryData: MemoryData = {
          photoUri: asset.uri,
          location: latitude && longitude ? {
            latitude,
            longitude,
            placeName: undefined, // Will be set after reverse geocoding if needed
          } : undefined,
          timestamp: creationDate,
          photoExif: asset.exif ? {
            dateTime: asset.exif.DateTimeOriginal || asset.exif.DateTime,
            make: asset.exif.Make,
            model: asset.exif.Model,
            gps: latitude && longitude ? {
              latitude,
              longitude,
            } : undefined,
          } : undefined,
        };
        
        console.log(`🚀 [Photo Service] Analyzing photo with Gemini AI...`);
        
        // Use createRichMemory which uses Gemini for analysis
        const memoryTemplate = await createRichMemory('photo', memoryData);
        
        // Create full memory entry with Gemini-generated summary and description
        const memory: MemoryEntry = {
          ...memoryTemplate,
          id: generateUUID(), // Generate unique ID
          details: {
            ...memoryTemplate.details,
            uri: asset.uri, // Local URI for the photo
            width: asset.width,
            height: asset.height,
            fileName: asset.fileName,
            fileSize: asset.fileSize,
            exif: asset.exif, // Store raw EXIF data
            // Store origin detection info for UI indicator
            isDownloadedPhoto: !originDetection.likelyTakenOnPhone,
            originConfidence: originDetection.confidence,
          },
        };
        
        console.log(`✅ [Photo Service] Gemini analysis complete: "${memory.summary}"`);
        console.log(`   Description: ${memory.details?.description?.substring(0, 80)}...`);
        
        memories.push(memory);
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        console.warn(`⚠️ [Photo Service] Gemini analysis failed (${errorMsg}), using enhanced fallback`);
        
        // Check if it's a backend unavailable error (503, 502, 504) or network error
        const isBackendUnavailable = errorMsg.includes('503') || errorMsg.includes('502') || errorMsg.includes('504') || 
                                     errorMsg.includes('Tunnel Unavailable') || errorMsg.includes('timeout') || 
                                     errorMsg.includes('network') || errorMsg.includes('Upload failed');
        
        if (isBackendUnavailable) {
          console.log(`ℹ️ Backend unavailable - using enhanced local analysis (this is normal when backend/tunnel is down)`);
        }
        
        // Fallback to enhanced local generation
        const timeOfDay = getTimeOfDay(creationDate);
        const dayOfWeek = getDayOfWeek(creationDate);
        
        // Create enhanced summary using available context
        const summaryParts: string[] = [];
        const descParts: string[] = [];
        
        if (timeOfDay) {
          summaryParts.push(timeOfDay);
          descParts.push(`A ${timeOfDay} moment`);
        }
        
        if (dayOfWeek && (dayOfWeek.toLowerCase() === 'saturday' || dayOfWeek.toLowerCase() === 'sunday')) {
          summaryParts.unshift(dayOfWeek);
          descParts.push(`on ${dayOfWeek}`);
        }
        
        if (latitude && longitude) {
          descParts.push('with location data');
        }
        
        // Build enhanced summary
        let summary = summaryParts.length > 0 
          ? `Memorable ${summaryParts.join(' ')} photo`
          : 'Memorable photo moment';
        
        // Build enhanced description with varied language
        const descVariations = [
          descParts.length > 0 ? `${descParts.join(' ')}. A captured memory worth remembering.` : 'A moment captured in time.',
          descParts.length > 0 ? `${descParts.join(' ')}. This snapshot preserves a special memory.` : 'A snapshot of a meaningful moment.',
          descParts.length > 0 ? `${descParts.join(' ')}. Captured and saved for later.` : 'A memory preserved.',
        ];
        description = descVariations[Math.floor(Math.random() * descVariations.length)];
        
        // Don't append camera info - keep descriptions natural and varied
        
        // Create memory entry with enhanced fallback summary
        const memory = createMemoryEntry('photo', summary, {
          startTime: creationDate,
          latitude,
          longitude,
          details: {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            fileName: asset.fileName,
            fileSize: asset.fileSize,
            exif: asset.exif,
            description,
            isDownloadedPhoto: !originDetection.likelyTakenOnPhone,
            originConfidence: originDetection.confidence,
            // Indicate this was a fallback (not Gemini)
            usedGemini: false,
            dataQuality: 'limited',
          },
        });
        
        console.log(`✅ [Photo Service] Enhanced fallback summary: "${summary}"`);
        memories.push(memory);
      }
    }
    
    return memories;
  } catch (error) {
    console.error('Error picking photos:', error);
    throw error;
  }
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

