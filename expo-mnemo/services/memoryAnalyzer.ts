/**
 * Memory Analyzer - Intelligent memory generation from multiple data sources
 * 
 * PRIMARY: Uses Gemini AI for comprehensive memory analysis
 * FALLBACK: Local analysis if Gemini unavailable
 * 
 * Combines location, photos, audio, and time context to generate rich memories
 * Works with limited data and provides warnings when data is insufficient
 */

import { MemoryEntry, MemoryKind } from '../types/MemoryEntry';
import { analyzeImage } from './imageAnalysisService';
import { API_CONFIG } from '../config/apiConfig';

export interface MemoryData {
  // Core data
  audioUri?: string;
  photoUri?: string;
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
  };
  timestamp: Date;
  
  // Additional context
  photoExif?: {
    dateTime?: string;
    make?: string;
    model?: string;
    gps?: {
      latitude: number;
      longitude: number;
    };
  };
  audioEmotion?: {
    emotion: string;
    confidence: number;
  };
  
  // User provided
  userNote?: string;
  tags?: string[];
}

export interface GeneratedMemory {
  summary: string;
  description: string;
  tags: string[];
  confidence: number;
  dataSources: string[]; // What data was used to generate this
  warnings?: string[]; // Warnings about data quality
  dataQuality?: 'excellent' | 'good' | 'limited' | 'minimal';
  usedGemini?: boolean; // Whether Gemini was used
}

/**
 * Analyze and generate a memory from available data using Gemini AI (PRIMARY)
 * Falls back to local analysis if Gemini unavailable
 * Works intelligently even with partial data
 */
export async function generateMemory(data: MemoryData): Promise<GeneratedMemory> {
  // TRY GEMINI FIRST (PRIMARY METHOD)
  try {
    const geminiResult = await analyzeWithGemini(data);
    if (geminiResult) {
      console.log('✅ Using Gemini AI for memory analysis');
      return geminiResult;
    }
  } catch (error) {
    console.log('⚠️ Gemini unavailable, using local analysis');
  }
  
  // FALLBACK: Local analysis
  console.log('📝 Using local memory analysis');
  return await generateMemoryLocal(data);
}

/**
 * Analyze memory using Gemini AI (PRIMARY METHOD)
 */
async function analyzeWithGemini(data: MemoryData): Promise<GeneratedMemory | null> {
  try {
    console.log('🚀 [Memory Analyzer] Attempting Gemini analysis...');
    console.log('📊 [Memory Analyzer] Data sources:', {
      hasPhoto: !!data.photoUri,
      hasAudio: !!data.audioUri,
      hasLocation: !!data.location,
      hasUserNote: !!data.userNote,
      hasAudioEmotion: !!data.audioEmotion,
    });
    
    const formData = new FormData();
    
    // Add photo if available
    if (data.photoUri) {
      const filename = data.photoUri.split('/').pop() || 'photo.jpg';
      const fileType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      formData.append('photo', {
        uri: data.photoUri,
        type: fileType,
        name: filename,
      } as any);
      console.log('📸 [Memory Analyzer] Added photo to FormData');
    }
    
    // Add audio file if available
    if (data.audioUri) {
      const filename = data.audioUri.split('/').pop() || 'audio.m4a';
      const fileType = filename.endsWith('.m4a') ? 'audio/m4a' : 
                       filename.endsWith('.mp3') ? 'audio/mp3' : 
                       filename.endsWith('.wav') ? 'audio/wav' : 'audio/m4a';
      
      formData.append('audio', {
        uri: data.audioUri,
        type: fileType,
        name: filename,
      } as any);
      console.log('🎤 [Memory Analyzer] Added audio file to FormData');
    }
    
    // Add location
    if (data.location) {
      if (data.location.placeName) {
        formData.append('locationName', data.location.placeName);
      }
      formData.append('latitude', data.location.latitude.toString());
      formData.append('longitude', data.location.longitude.toString());
    }
    
    // Add user note
    if (data.userNote) {
      formData.append('userNote', data.userNote);
    }
    
    // Add timestamp and context
    formData.append('timestamp', data.timestamp.toISOString());
    
    const timeContext = getTimeContext(data.timestamp);
    formData.append('timeOfDay', timeContext.timeOfDay);
    formData.append('dayOfWeek', timeContext.dayOfWeek);
    
    // Add emotion if available
    if (data.audioEmotion) {
      formData.append('audioEmotion', data.audioEmotion.emotion);
    }
    
    // Call Gemini memory analysis API
    const apiUrl = `${API_CONFIG.BASE_URL}/api/memory/analyze`;
    console.log('🌐 [Memory Analyzer] Calling backend API:', apiUrl);
    console.log('📡 [Memory Analyzer] API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        // Don't set Content-Type - let FormData set it with boundary
      },
    });
    
    clearTimeout(timeoutId);
    
    console.log('📥 [Memory Analyzer] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Memory Analyzer] API error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ [Memory Analyzer] Gemini analysis successful:', {
      summary: result.summary,
      usedGemini: result.usedGemini,
      dataQuality: result.dataQuality,
    });
    
    return {
      summary: result.summary,
      description: result.description,
      tags: result.tags || [],
      confidence: result.confidence || 0.8,
      dataSources: result.dataSources || [],
      warnings: result.warnings || [],
      dataQuality: result.dataQuality || 'good',
      usedGemini: result.usedGemini !== false,
      audioTranscript: result.audioTranscript || undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏱️ [Memory Analyzer] Gemini API timeout after 30s');
    } else if (error instanceof Error) {
      console.error('❌ [Memory Analyzer] Gemini API error:', error.message);
      console.error('❌ [Memory Analyzer] Error stack:', error.stack);
    } else {
      console.error('❌ [Memory Analyzer] Unknown error:', error);
    }
    return null;
  }
}

/**
 * Local memory analysis (FALLBACK)
 */
async function generateMemoryLocal(data: MemoryData): Promise<GeneratedMemory> {
  const dataSources: string[] = [];
  let summary = '';
  let description = '';
  let tags: string[] = [];
  let confidence = 0.7;

  // Analyze what data we have
  const hasPhoto = !!data.photoUri;
  const hasAudio = !!data.audioUri;
  const hasLocation = !!data.location;
  const hasUserNote = !!data.userNote;

  // Get time context
  const timeContext = getTimeContext(data.timestamp);
  
  // 1. Photo Analysis (highest priority if available)
  if (hasPhoto) {
    dataSources.push('photo');
    try {
      const imageAnalysis = await analyzeImage({
        imageUri: data.photoUri,
        location: data.location,
        timeOfDay: timeContext.timeOfDay,
        dayOfWeek: timeContext.dayOfWeek,
      });
      
      summary = imageAnalysis.summary;
      description = imageAnalysis.description;
      tags = imageAnalysis.tags || [];
      confidence = imageAnalysis.confidence;
      
      // Enhance with EXIF data if available
      if (data.photoExif) {
        dataSources.push('exif');
        if (data.photoExif.make) {
          description += ` Photo taken with ${data.photoExif.make}`;
          if (data.photoExif.model) {
            description += ` ${data.photoExif.model}`;
          }
          description += '.';
        }
      }
    } catch (error) {
      console.log('📸 Photo analysis unavailable, using fallback');
    }
  }

  // 2. Audio/Emotion Analysis
  if (hasAudio && data.audioEmotion) {
    dataSources.push('audio');
    const emotion = data.audioEmotion.emotion;
    
    if (!summary) {
      summary = `${capitalize(emotion)} moment`;
    } else {
      // Enhance existing summary
      summary = `${capitalize(emotion)} - ${summary}`;
    }
    
    if (!description) {
      description = `A ${emotion} voice note captured during ${timeContext.label}.`;
    }
    
    tags.push(emotion, 'voice');
    confidence = Math.max(confidence, data.audioEmotion.confidence);
  }

  // 3. Location Context
  if (hasLocation && data.location) {
    dataSources.push('location');
    
    if (data.location.placeName) {
      if (!summary) {
        summary = `Moment at ${data.location.placeName}`;
      } else if (!summary.includes(data.location.placeName)) {
        summary += ` at ${data.location.placeName}`;
      }
      
      if (!description.includes(data.location.placeName)) {
        description += ` Located at ${data.location.placeName}.`;
      }
      
      tags.push('location');
    }
  }

  // 4. Time Context (always available)
  dataSources.push('time');
  if (!summary) {
    summary = `${timeContext.label} moment`;
  }
  
  if (!description) {
    description = `A moment captured on ${timeContext.fullDate} during ${timeContext.label}.`;
  }
  
  tags.push(timeContext.timeOfDay);

  // 5. User Note (highest priority if provided)
  if (hasUserNote && data.userNote) {
    dataSources.push('user-note');
    // User's words take precedence
    summary = data.userNote;
    description = `"${data.userNote}" - ${description}`;
    confidence = 1.0; // User input is always high confidence
  }

  // 6. User Tags
  if (data.tags && data.tags.length > 0) {
    tags = [...new Set([...tags, ...data.tags])]; // Merge and deduplicate
  }

  // Final cleanup
  summary = summary.trim();
  description = description.trim();
  tags = [...new Set(tags)].slice(0, 5); // Keep top 5 unique tags

  return {
    summary,
    description,
    tags,
    confidence: Math.round(confidence * 100) / 100,
    dataSources,
  };
}

/**
 * Generate a rich memory entry from multiple data sources
 * This is the main function apps should call
 */
export async function createRichMemory(
  kind: MemoryKind,
  data: MemoryData
): Promise<Omit<MemoryEntry, 'id'>> {
  // Generate intelligent summary and description using Gemini (primary) or local (fallback)
  const generated = await generateMemory(data);

  // Build memory entry
  const memory: Omit<MemoryEntry, 'id'> = {
    kind,
    startTime: data.timestamp.toISOString(),
    endTime: data.timestamp.toISOString(),
    summary: generated.summary,
    details: {
      description: generated.description,
      confidence: generated.confidence,
      dataSources: generated.dataSources,
      tags: generated.tags,
      warnings: generated.warnings || [],
      dataQuality: generated.dataQuality || 'good',
      usedGemini: generated.usedGemini !== false,
      transcript: generated.audioTranscript || undefined,
    },
  };

  // Add kind-specific details
  if (kind === 'photo' && data.photoUri) {
    if (!memory.details) memory.details = {};
    memory.details.photoUri = data.photoUri;
    
    // Add photo origin detection
    if (data.photoExif) {
      const isDownloaded = detectDownloadedPhoto(data.photoExif, data.timestamp);
      if (isDownloaded) {
        memory.details.isDownloadedPhoto = true;
        memory.details.originConfidence = 'high';
      }
    }
  }

  if (kind === 'emotional' && data.audioUri) {
    if (!memory.details) memory.details = {};
    memory.details.audioUri = data.audioUri;
    
    if (data.audioEmotion) {
      memory.details.emotion = data.audioEmotion.emotion;
      memory.details.emotionConfidence = data.audioEmotion.confidence;
    }
    
    // Transcript is already stored in details above
  }

  if (kind === 'context' && data.location) {
    memory.latitude = data.location.latitude;
    memory.longitude = data.location.longitude;
    memory.placeName = data.location.placeName || undefined;
  }

  return memory;
}

/**
 * Get time context for a given timestamp
 */
function getTimeContext(timestamp: Date) {
  const hour = timestamp.getHours();
  const dayOfWeek = timestamp.toLocaleDateString('en-US', { weekday: 'long' });
  const fullDate = timestamp.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let timeOfDay: string;
  let label: string;

  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
    label = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
    label = 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening';
    label = 'evening';
  } else {
    timeOfDay = 'night';
    label = 'night';
  }

  return { timeOfDay, dayOfWeek, label, fullDate };
}

/**
 * Detect if a photo was downloaded vs taken on device
 */
function detectDownloadedPhoto(exif: any, timestamp: Date): boolean {
  // If no camera make/model, likely downloaded
  if (!exif.make && !exif.model) {
    return true;
  }

  // If EXIF timestamp differs significantly from file timestamp
  if (exif.dateTime) {
    const exifDate = new Date(exif.dateTime);
    const diffHours = Math.abs(exifDate.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    // If more than 24 hours difference, likely downloaded
    if (diffHours > 24) {
      return true;
    }
  }

  return false;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Batch analyze multiple memories
 * Useful for processing imported photos or syncing
 */
export async function batchAnalyzeMemories(
  dataList: Array<{ kind: MemoryKind; data: MemoryData }>
): Promise<Array<Omit<MemoryEntry, 'id'>>> {
  const memories: Array<Omit<MemoryEntry, 'id'>> = [];

  // Process in batches of 3 to avoid overwhelming API
  for (let i = 0; i < dataList.length; i += 3) {
    const batch = dataList.slice(i, i + 3);
    const batchResults = await Promise.all(
      batch.map(({ kind, data }) => createRichMemory(kind, data))
    );
    memories.push(...batchResults);
    
    // Small delay between batches
    if (i + 3 < dataList.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return memories;
}

