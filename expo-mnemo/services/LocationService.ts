/**
 * LocationService - Passive context logging using expo-location
 * 
 * Provides foreground polling and optional background location tracking.
 * Creates context memory entries when significant movement is detected.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Accelerometer } from 'expo-sensors';
import { MemoryEntry, createMemoryEntry } from '../types/MemoryEntry';
import { generateContextMemorySummary, enhanceMemoryWithContext } from './memoryGenerator';

const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
const SIGNIFICANT_DISTANCE_THRESHOLD = 500; // meters - only update when moved 500m
const FOREGROUND_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MOTION_THRESHOLD = 2.0; // Much higher threshold to reduce false positives
const MOTION_CHECK_INTERVAL = 60000; // Check motion every 60 seconds (even less frequent)

// Store last known location to detect significant movement
let lastKnownLocation: { latitude: number; longitude: number } | null = null;
let memoryCallback: ((memory: MemoryEntry) => void) | null = null;
let foregroundPollTimer: NodeJS.Timeout | null = null;
let motionSubscription: any = null;
let motionCheckTimer: NodeJS.Timeout | null = null;
let lastAccelerometerData: { x: number; y: number; z: number } | null = null;
let lastMagnitude: number | null = null;
let isPassiveLoggingActive = false;

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
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

/**
 * Process a location update and create memory entry if significant movement detected
 */
async function processLocationUpdate(
  latitude: number,
  longitude: number,
  timestamp: Date
): Promise<void> {
  if (!memoryCallback) {
    return;
  }
  
  // Check if this is significant movement
  if (lastKnownLocation) {
    const distance = calculateDistance(
      lastKnownLocation.latitude,
      lastKnownLocation.longitude,
      latitude,
      longitude
    );
    
    // Only create memory if moved more than threshold
    if (distance < SIGNIFICANT_DISTANCE_THRESHOLD) {
      return;
    }
  }
  
  // Update last known location
  lastKnownLocation = { latitude, longitude };
  
  // Try to get place name via reverse geocoding
  let placeName: string | undefined;
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    
    if (results.length > 0) {
      const result = results[0];
      const parts: string[] = [];
      
      if (result.name) parts.push(result.name);
      if (result.street) parts.push(result.street);
      if (result.city) parts.push(result.city);
      if (result.region) parts.push(result.region);
      
      placeName = parts.length > 0 ? parts.join(', ') : undefined;
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error);
  }
  
  // Generate context-aware summary
  const summary = generateContextMemorySummary(placeName, latitude, longitude);
  
  const memory = createMemoryEntry('context', summary, {
    startTime: timestamp,
    latitude,
    longitude,
    placeName,
  });
  
  // Enhance memory with context
  const enhancedMemory = enhanceMemoryWithContext(memory);
  
  // Notify callback (MemoryContext will handle saving)
  memoryCallback(enhancedMemory);
}

/**
 * Background location task handler
 * 
 * NOTE: Background tasks have limitations in Expo Go on iOS.
 * This will work in development builds but may not work in Expo Go.
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    
    for (const location of locations) {
      await processLocationUpdate(
        location.coords.latitude,
        location.coords.longitude,
        new Date(location.timestamp)
      );
    }
  }
});

/**
 * LocationService - Passive context logging service
 */
export class LocationService {
  /**
   * Request location permissions (foreground and background)
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      // Request foreground permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        // Silently handle - user may not have granted permission yet
        return false;
      }
      
      // Request background permissions (may not be available in Expo Go)
      try {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus === 'granted') {
          return true;
        } else {
          // Background not granted, but foreground is - that's fine
          return true; // Still return true, we can use foreground polling
        }
      } catch (error) {
        // Background permissions may not be available in Expo Go
        // This is expected and fine - we'll use foreground polling only
        return true; // Still return true for foreground-only mode
      }
    } catch (error) {
      // Silently handle permission errors - they're expected in some cases
      return false;
    }
  }
  
  /**
   * Start passive location updates
   * 
   * Uses foreground polling (always works) and optionally background tasks (if available).
   */
  async startPassiveLocationUpdates(
    onMemoryCreated: (memory: MemoryEntry) => void
  ): Promise<void> {
    if (isPassiveLoggingActive) {
      console.log('Passive location updates already active');
      return;
    }
    
    // Set callback for memory creation
    memoryCallback = onMemoryCreated;
    
    // Request permissions
    const hasPermission = await this.requestLocationPermissions();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }
    
    isPassiveLoggingActive = true;
    
    // Start foreground polling (always works, even in Expo Go)
    this.startForegroundPolling();
    
    // Try to start background tracking (may not work in Expo Go)
    try {
      await this.startBackgroundTracking();
    } catch (error) {
      // Silently handle - background tracking not available in Expo Go (expected)
      // Foreground polling will continue to work
    }
  }
  
  /**
   * Stop passive location updates
   */
  stopPassiveLocationUpdates(): void {
    if (!isPassiveLoggingActive) {
      return;
    }
    
    isPassiveLoggingActive = false;
    memoryCallback = null;
    lastKnownLocation = null;
    
    // Stop foreground polling
    this.stopForegroundPolling();
    
    // Stop background tracking
    this.stopBackgroundTracking();
  }
  
  /**
   * Start foreground polling - periodically gets location when app is in use
   * Also starts motion-based location updates
   */
  private startForegroundPolling(): void {
    // Get initial location
    this.pollLocation();
    
    // Set up periodic polling
    foregroundPollTimer = setInterval(() => {
      this.pollLocation();
    }, FOREGROUND_POLL_INTERVAL);
    
    // Start motion-based location tracking
    this.startMotionBasedTracking();
  }
  
  /**
   * Start motion-based location tracking
   * Updates location when device movement is detected via accelerometer
   */
  private startMotionBasedTracking(): void {
    // Set accelerometer update interval (10 Hz)
    Accelerometer.setUpdateInterval(1000);
    
    // Subscribe to accelerometer updates
    motionSubscription = Accelerometer.addListener((accelerometerData) => {
      lastAccelerometerData = accelerometerData;
    });
    
    // Check for movement periodically
    motionCheckTimer = setInterval(() => {
      this.checkMotionAndUpdateLocation();
    }, MOTION_CHECK_INTERVAL);
  }
  
  /**
   * Check if device is moving based on accelerometer data
   * If movement detected, update location
   */
  private async checkMotionAndUpdateLocation(): Promise<void> {
    if (!lastAccelerometerData || !isPassiveLoggingActive) {
      return;
    }
    
    // Calculate magnitude of acceleration
    const magnitude = Math.sqrt(
      lastAccelerometerData.x ** 2 +
      lastAccelerometerData.y ** 2 +
      lastAccelerometerData.z ** 2
    );
    
    // Detect CHANGE in acceleration (not absolute value)
    // Normal gravity is ~1.0, so we detect significant changes from baseline
    if (lastMagnitude !== null) {
      const change = Math.abs(magnitude - lastMagnitude);
      
      // If change exceeds threshold, device is likely moving
      if (change > MOTION_THRESHOLD) {
        console.log(`📱 Motion detected (change: ${change.toFixed(2)}, magnitude: ${magnitude.toFixed(2)}), updating location...`);
        // Trigger location update
        await this.pollLocation();
      }
    }
    
    // Update last magnitude for next check
    lastMagnitude = magnitude;
  }
  
  /**
   * Stop motion-based tracking
   */
  private stopMotionBasedTracking(): void {
    if (motionSubscription) {
      motionSubscription.remove();
      motionSubscription = null;
    }
    
    if (motionCheckTimer) {
      clearInterval(motionCheckTimer);
      motionCheckTimer = null;
    }
    
    lastAccelerometerData = null;
    lastMagnitude = null;
  }
  
  /**
   * Stop foreground polling
   */
  private stopForegroundPolling(): void {
    if (foregroundPollTimer) {
      clearInterval(foregroundPollTimer);
      foregroundPollTimer = null;
      console.log('Stopped foreground location polling');
    }
    
    // Stop motion-based tracking
    this.stopMotionBasedTracking();
  }
  
  /**
   * Poll current location (foreground)
   */
  private async pollLocation(): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Balance between accuracy and battery
      });
      
      await processLocationUpdate(
        location.coords.latitude,
        location.coords.longitude,
        new Date(location.timestamp)
      );
    } catch (error) {
      console.error('Error polling location:', error);
    }
  }
  
  /**
   * Start background location tracking using TaskManager
   * 
   * NOTE: This may not work in Expo Go on iOS due to limitations.
   * It will work in development builds and production builds.
   */
  private async startBackgroundTracking(): Promise<void> {
    // Check if TaskManager is available
    if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
      // Silently return - background tasks not available (expected in Expo Go)
      return;
    }
    
    try {
      // Check if already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        return;
      }
      
      // Start background location updates
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5 * 60 * 1000, // 5 minutes
        distanceInterval: SIGNIFICANT_DISTANCE_THRESHOLD, // 100 meters
        foregroundService: {
          notificationTitle: 'Mnemo Location Tracking',
          notificationBody: 'Tracking your location for context memories',
        },
      });
    } catch (error) {
      // Background tracking may not be available in Expo Go
      // This is expected and fine - we'll use foreground polling only
      // Silently handle the error
      throw error; // Re-throw so caller knows to continue with foreground only
    }
  }
  
  /**
   * Stop background location tracking
   */
  private async stopBackgroundTracking(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch (error) {
      // Silently handle - background tracking may not have been active
    }
  }
  
  /**
   * Check if passive logging is active
   */
  isActive(): boolean {
    return isPassiveLoggingActive;
  }
}

// Export singleton instance
export const locationService = new LocationService();
