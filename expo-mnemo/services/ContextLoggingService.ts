/**
 * ContextLoggingService - Orchestrates passive context logging
 * 
 * Coordinates location tracking, activity detection, and calendar integration
 * to create context memory entries.
 */

import { MemoryEntry, createMemoryEntry, ActivityType } from '../types/MemoryEntry';
import { locationService, LocationUpdate } from './LocationService';
import { memoryStore } from '../store/MemoryStore';
import { settingsStore } from '../store/SettingsStore';
import * as Location from 'expo-location';

export interface ContextLoggingService {
  /**
   * Start passive context logging
   */
  start(): Promise<void>;
  
  /**
   * Stop passive context logging
   */
  stop(): void;
  
  /**
   * Check if logging is active
   */
  isActive(): boolean;
  
  /**
   * Manually create a context entry from current location
   */
  createContextEntry(): Promise<MemoryEntry | null>;
}

/**
 * Implementation that coordinates location and activity tracking
 */
class ExpoContextLoggingService implements ContextLoggingService {
  private isActive = false;
  private lastLocation: LocationUpdate | null = null;
  private lastContextEntry: MemoryEntry | null = null;
  private locationUpdateThreshold = 100; // meters
  
  async start(): Promise<void> {
    if (this.isActive) {
      return;
    }
    
    // Check if enabled in settings
    const settings = await settingsStore.getSettings();
    if (!settings.enablePassiveContextLogging) {
      console.log('Passive context logging disabled in settings');
      return;
    }
    
    // Start location tracking
    await locationService.startForegroundTracking((location) => {
      this.handleLocationUpdate(location);
    });
    
    this.isActive = true;
    console.log('Context logging started');
  }
  
  stop(): void {
    if (!this.isActive) {
      return;
    }
    
    locationService.stopForegroundTracking();
    this.isActive = false;
    console.log('Context logging stopped');
  }
  
  isActive(): boolean {
    return this.isActive;
  }
  
  async createContextEntry(): Promise<MemoryEntry | null> {
    const location = await locationService.getCurrentLocation();
    if (!location) {
      return null;
    }
    
    const placeName = await locationService.reverseGeocode(
      location.latitude,
      location.longitude
    );
    
    // Detect activity if enabled
    let activityType: ActivityType | undefined;
    const settings = await settingsStore.getSettings();
    if (settings.useActivityDetection) {
      // TODO: Implement activity detection using expo-sensors or location accuracy
      // For now, infer from location accuracy/type
      activityType = 'unknown';
    }
    
    const summary = placeName || `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    
    const entry = createMemoryEntry('context', summary, {
      startTime: location.timestamp,
      latitude: location.latitude,
      longitude: location.longitude,
      placeName: placeName || undefined,
      activityType,
    });
    
    await memoryStore.add(entry);
    return entry;
  }
  
  /**
   * Handle location updates and create context entries when appropriate
   */
  private async handleLocationUpdate(location: LocationUpdate): Promise<void> {
    // Check if we should create a new context entry
    if (!this.lastLocation) {
      this.lastLocation = location;
      await this.createContextFromLocation(location);
      return;
    }
    
    // Calculate distance from last location
    const distance = this.calculateDistance(
      this.lastLocation.latitude,
      this.lastLocation.longitude,
      location.latitude,
      location.longitude
    );
    
    // Create entry if moved significantly
    if (distance > this.locationUpdateThreshold) {
      this.lastLocation = location;
      await this.createContextFromLocation(location);
    }
  }
  
  /**
   * Create a context memory entry from a location update
   */
  private async createContextFromLocation(location: LocationUpdate): Promise<void> {
    const placeName = await locationService.reverseGeocode(
      location.latitude,
      location.longitude
    );
    
    // Detect activity if enabled
    let activityType: ActivityType | undefined;
    const settings = await settingsStore.getSettings();
    if (settings.useActivityDetection) {
      // TODO: Implement activity detection
      activityType = 'unknown';
    }
    
    const summary = placeName || `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    
    const entry = createMemoryEntry('context', summary, {
      startTime: location.timestamp,
      latitude: location.latitude,
      longitude: location.longitude,
      placeName: placeName || undefined,
      activityType,
    });
    
    await memoryStore.add(entry);
    this.lastContextEntry = entry;
  }
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }
}

// Export singleton instance
export const contextLoggingService: ContextLoggingService = new ExpoContextLoggingService();

