/**
 * EmotionalCaptureService - Handles foreground audio recording sessions
 * 
 * Note: Sessions are foreground-only (user explicitly starts them).
 * No background mic recording per design constraints.
 */

import { Audio } from 'expo-av';
import { EmotionClassifier, Emotion, EmotionResult } from './EmotionClassifier';
import { MemoryEntry, createMemoryEntry } from '../types/MemoryEntry';
import { memoryStore } from '../store/MemoryStore';
import { locationService } from './LocationService';

export interface EmotionalEvent {
  timestamp: Date;
  emotion: Emotion;
  confidence: number;
  transcript?: string;
  audioUri?: string;
}

export interface EmotionalCaptureService {
  /**
   * Start an emotional capture session
   */
  startSession(): Promise<void>;
  
  /**
   * Stop the current session
   */
  stopSession(): Promise<void>;
  
  /**
   * Check if session is active
   */
  isSessionActive(): boolean;
  
  /**
   * Get session duration in seconds
   */
  getSessionDuration(): number;
  
  /**
   * Subscribe to emotional events
   */
  onEmotionalEvent(callback: (event: EmotionalEvent) => void): () => void;
}

/**
 * Configuration for emotion detection
 */
interface EmotionDetectionConfig {
  detectionThreshold: number;  // Confidence threshold (0.0 to 1.0)
  detectionInterval: number;     // How often to check (seconds)
  triggerEmotions: Emotion[];    // Which emotions trigger events
  cooldownPeriod: number;        // Seconds between events
}

const DEFAULT_CONFIG: EmotionDetectionConfig = {
  detectionThreshold: 0.6,
  detectionInterval: 2.0,  // Check every 2 seconds
  triggerEmotions: ['happy', 'surprised'],
  cooldownPeriod: 5.0,
};

/**
 * Implementation using expo-av for audio recording
 */
class ExpoEmotionalCaptureService implements EmotionalCaptureService {
  private recording: Audio.Recording | null = null;
  private sessionStartTime: Date | null = null;
  private isActive = false;
  private eventCallbacks: Set<(event: EmotionalEvent) => void> = new Set();
  private detectionTimer: NodeJS.Timeout | null = null;
  private lastEventTime: Date | null = null;
  private emotionClassifier: EmotionClassifier;
  private config: EmotionDetectionConfig;
  
  constructor(
    classifier: EmotionClassifier,
    config: Partial<EmotionDetectionConfig> = {}
  ) {
    this.emotionClassifier = classifier;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  async startSession(): Promise<void> {
    if (this.isActive) {
      return;
    }
    
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPreset.HIGH_QUALITY
      );
      
      this.recording = recording;
      this.sessionStartTime = new Date();
      this.isActive = true;
      
      // Start periodic emotion detection
      this.startDetectionLoop();
      
      console.log('Emotional capture session started');
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }
  
  async stopSession(): Promise<void> {
    if (!this.isActive) {
      return;
    }
    
    // Stop detection loop
    if (this.detectionTimer) {
      clearInterval(this.detectionTimer);
      this.detectionTimer = null;
    }
    
    // Stop recording
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
    
    this.isActive = false;
    this.sessionStartTime = null;
    console.log('Emotional capture session stopped');
  }
  
  isSessionActive(): boolean {
    return this.isActive;
  }
  
  getSessionDuration(): number {
    if (!this.sessionStartTime) {
      return 0;
    }
    return Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000);
  }
  
  onEmotionalEvent(callback: (event: EmotionalEvent) => void): () => void {
    this.eventCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventCallbacks.delete(callback);
    };
  }
  
  /**
   * Start periodic emotion detection loop
   * 
   * Every N seconds, analyze the recorded audio and detect emotions.
   * If confidence exceeds threshold, trigger an event.
   */
  private startDetectionLoop(): void {
    this.detectionTimer = setInterval(async () => {
      if (!this.isActive || !this.recording) {
        return;
      }
      
      // Check cooldown
      if (this.lastEventTime) {
        const timeSinceLastEvent = (Date.now() - this.lastEventTime.getTime()) / 1000;
        if (timeSinceLastEvent < this.config.cooldownPeriod) {
          return;
        }
      }
      
      try {
        // Get recording status (contains URI)
        const status = await this.recording.getStatusAsync();
        if (!status.isRecording || !status.uri) {
          return;
        }
        
        // Classify emotion from audio
        const result = await this.emotionClassifier.classify(status.uri);
        
        // Check if emotion should trigger event
        if (
          this.config.triggerEmotions.includes(result.emotion) &&
          result.confidence >= this.config.detectionThreshold
        ) {
          // Get current location
          const location = await locationService.getCurrentLocation();
          const placeName = location
            ? await locationService.reverseGeocode(location.latitude, location.longitude)
            : null;
          
          // Create emotional event
          const event: EmotionalEvent = {
            timestamp: new Date(),
            emotion: result.emotion,
            confidence: result.confidence,
            audioUri: status.uri,
          };
          
          // Notify callbacks
          this.eventCallbacks.forEach(callback => callback(event));
          
          // Save to memory store
          await this.saveEmotionalMemory(event, location, placeName);
          
          this.lastEventTime = new Date();
        }
      } catch (error) {
        console.error('Error in detection loop:', error);
      }
    }, this.config.detectionInterval * 1000);
  }
  
  /**
   * Save emotional event as MemoryEntry
   */
  private async saveEmotionalMemory(
    event: EmotionalEvent,
    location: { latitude: number; longitude: number } | null,
    placeName: string | null
  ): Promise<void> {
    const summary = `${event.emotion.charAt(0).toUpperCase() + event.emotion.slice(1)} moment detected`;
    
    const entry = createMemoryEntry('emotional', summary, {
      startTime: event.timestamp,
      latitude: location?.latitude,
      longitude: location?.longitude,
      placeName: placeName || undefined,
      details: {
        emotion: event.emotion,
        confidence: event.confidence,
        transcript: event.transcript,
        audioUri: event.audioUri,
      },
    });
    
    await memoryStore.add(entry);
  }
}

// Export singleton instance
import { emotionClassifier } from './EmotionClassifier';
export const emotionalCaptureService: EmotionalCaptureService = new ExpoEmotionalCaptureService(
  emotionClassifier,
  {
    detectionThreshold: 0.6,  // Lower for easier testing
    detectionInterval: 3.0,    // Check every 3 seconds
  }
);

