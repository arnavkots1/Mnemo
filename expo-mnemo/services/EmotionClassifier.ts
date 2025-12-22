/**
 * EmotionClassifier - Emotion classification with local stub and optional API support
 * 
 * Supports two modes:
 * 1. Local stub classifier (default) - uses audio properties
 * 2. Remote API classifier - calls backend server
 */

export type Emotion = 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral';

export interface AudioInfo {
  durationSec: number;
  averageLevel?: number; // Normalized audio level (0.0 to 1.0)
  audioUri?: string;     // Local URI for audio file (for API mode)
}

export interface EmotionResult {
  emotion: Emotion;
  confidence: number;
}

/**
 * Configuration for emotion classifier
 */
export interface EmotionClassifierConfig {
  useApi: boolean;
  apiUrl?: string;  // e.g., 'http://localhost:3000/api' or 'https://api.mnemo.app/api'
}

// Default: use local stub
const DEFAULT_CONFIG: EmotionClassifierConfig = {
  useApi: false,
};

let classifierConfig: EmotionClassifierConfig = { ...DEFAULT_CONFIG };

/**
 * Configure emotion classifier to use API or local stub
 */
export function configureEmotionClassifier(config: Partial<EmotionClassifierConfig>): void {
  classifierConfig = { ...DEFAULT_CONFIG, ...config };
  console.log('Emotion classifier configured:', classifierConfig);
}

/**
 * Classify emotion using local stub logic based on audio properties
 * 
 * @param audioInfo - Audio duration and optional average level
 * @returns Emotion classification
 */
export function classifyEmotionStub(audioInfo: AudioInfo): Emotion {
  const { durationSec, averageLevel } = audioInfo;
  
  // If we have volume level, use it to bias towards happy for high volume
  if (averageLevel !== undefined) {
    // High volume (>0.7) -> biased towards happy/surprised
    if (averageLevel > 0.7) {
      const highVolumeEmotions: Emotion[] = ['happy', 'happy', 'surprised', 'happy'];
      return highVolumeEmotions[Math.floor(Math.random() * highVolumeEmotions.length)];
    }
    
    // Medium volume (0.4-0.7) -> neutral or happy
    if (averageLevel > 0.4) {
      const mediumVolumeEmotions: Emotion[] = ['neutral', 'happy', 'neutral'];
      return mediumVolumeEmotions[Math.floor(Math.random() * mediumVolumeEmotions.length)];
    }
    
    // Low volume (<0.4) -> sad or neutral
    const lowVolumeEmotions: Emotion[] = ['sad', 'neutral', 'sad'];
    return lowVolumeEmotions[Math.floor(Math.random() * lowVolumeEmotions.length)];
  }
  
  // If no volume level, use duration as a proxy
  // Longer recordings might indicate more engagement (happy/surprised)
  if (durationSec > 15) {
    const longEmotions: Emotion[] = ['happy', 'surprised', 'happy', 'neutral'];
    return longEmotions[Math.floor(Math.random() * longEmotions.length)];
  }
  
  if (durationSec > 5) {
    const mediumEmotions: Emotion[] = ['neutral', 'happy', 'neutral'];
    return mediumEmotions[Math.floor(Math.random() * mediumEmotions.length)];
  }
  
  // Short recordings -> random
  const allEmotions: Emotion[] = ['happy', 'sad', 'angry', 'surprised', 'neutral'];
  return allEmotions[Math.floor(Math.random() * allEmotions.length)];
}

/**
 * Classify emotion using remote API
 * 
 * @param audioInfo - Audio info including URI or fakeId for testing
 * @returns Emotion classification result
 */
async function classifyEmotionApi(audioInfo: AudioInfo): Promise<EmotionResult> {
  if (!classifierConfig.apiUrl) {
    throw new Error('API URL not configured');
  }
  
  // Try file upload if we have audioUri
  if (audioInfo.audioUri) {
    try {
      // Create FormData for file upload (React Native compatible)
      const formData = new FormData();
      
      // Extract filename from URI
      const fileName = audioInfo.audioUri.split('/').pop() || 'audio.m4a';
      const fileType = fileName.endsWith('.m4a') ? 'audio/m4a' : 'audio/mpeg';
      
      // Append audio file (React Native FormData format)
      formData.append('audio', {
        uri: audioInfo.audioUri,
        type: fileType,
        name: fileName,
      } as any);
      
      // Add timeout - increased for ML inference
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for ML
      
      const uploadResponse = await fetch(`${classifierConfig.apiUrl}/classify-emotion-upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }
      
      const result = await uploadResponse.json() as EmotionResult;
      console.log('✅ Audio uploaded and classified with ML model');
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏱️ Audio upload timeout (this is normal if backend is not running)');
      } else {
        console.error('Error uploading audio:', error);
      }
      // Fall back to legacy endpoint
    }
  }
  
  // Legacy endpoint (for backward compatibility)
  try {
    const requestBody: { audioUrl?: string; audioUri?: string; fakeId?: string } = {};
    
    if (audioInfo.audioUri) {
      requestBody.audioUri = audioInfo.audioUri;
    } else {
      requestBody.fakeId = `audio-${Date.now()}`;
    }
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    const response = await fetch(`${classifierConfig.apiUrl}/classify-emotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json() as EmotionResult;
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('⏱️ Emotion API timeout (backend may not be running)');
    } else {
      console.error('Error calling emotion API:', error);
    }
    console.log('✅ Using local stub classifier...');
    // Fallback to stub on error (including timeout)
    const emotion = classifyEmotionStub(audioInfo);
    return {
      emotion,
      confidence: 0.5, // Lower confidence on fallback
    };
  }
}

/**
 * Classify emotion - uses API if configured, otherwise uses local stub
 * 
 * @param audioInfo - Audio information
 * @returns Emotion classification result
 */
export async function classifyEmotion(audioInfo: AudioInfo): Promise<EmotionResult> {
  if (classifierConfig.useApi && classifierConfig.apiUrl) {
    return await classifyEmotionApi(audioInfo);
  } else {
    // Use local stub
    const emotion = classifyEmotionStub(audioInfo);
    return {
      emotion,
      confidence: 0.6 + Math.random() * 0.3, // 0.6 to 0.9
    };
  }
}
