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
import { getRichLocationName } from './googlePlacesService';

const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
const SIGNIFICANT_DISTANCE_THRESHOLD = 500; // meters - only log when moved 500m in a different direction
const FOREGROUND_POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const MOTION_THRESHOLD = 5.0; // Very high threshold - only detect significant movement like walking/driving
const MOTION_CHECK_INTERVAL = 5 * 60 * 1000; // Check motion every 5 minutes (less frequent)
const LOCATION_ACCURACY = Location.Accuracy.BestForNavigation; // Highest accuracy - GPS, WiFi, cell towers

// Store last known location and time to enforce both distance AND time criteria
let lastKnownLocation: { latitude: number; longitude: number; timestamp: number } | null = null;
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
 * Process a location update and create memory entry ONLY if BOTH conditions met:
 * 1. At least 10 minutes since last location memory
 * 2. Moved at least 500 meters from last known location
 */
async function processLocationUpdate(
  latitude: number,
  longitude: number,
  timestamp: Date
): Promise<void> {
  if (!memoryCallback) {
    return;
  }
  
  const now = timestamp.getTime();
  
  // Check BOTH distance AND time criteria
  if (lastKnownLocation) {
    const distance = calculateDistance(
      lastKnownLocation.latitude,
      lastKnownLocation.longitude,
      latitude,
      longitude
    );
    
    const timeSinceLastUpdate = now - lastKnownLocation.timestamp;
    const minutesSinceLastUpdate = Math.floor(timeSinceLastUpdate / (1000 * 60));
    
    // BOTH conditions must be true:
    // 1. At least 10 minutes passed
    // 2. Moved at least 500 meters
    const hasMovedEnough = distance >= SIGNIFICANT_DISTANCE_THRESHOLD;
    const hasEnoughTimePassed = minutesSinceLastUpdate >= 10;
    
    if (!hasMovedEnough || !hasEnoughTimePassed) {
      console.log(`📍 Location update skipped:`);
      console.log(`   Distance moved: ${distance.toFixed(0)}m ${hasMovedEnough ? '✅' : '❌'} (need 500m+)`);
      console.log(`   Time passed: ${minutesSinceLastUpdate} min ${hasEnoughTimePassed ? '✅' : '❌'} (need 10min+)`);
      return;
    }
    
    console.log(`📍 Location memory will be created:`);
    console.log(`   ✅ Moved ${distance.toFixed(0)}m (>${SIGNIFICANT_DISTANCE_THRESHOLD}m)`);
    console.log(`   ✅ ${minutesSinceLastUpdate} minutes passed (>10min)`);
  } else {
    console.log(`📍 First location check - creating initial location memory`);
  }
  
  // Update last known location with timestamp
  lastKnownLocation = { latitude, longitude, timestamp: now };
  
  // Try to get rich location name from Google Places API first
  let placeName: string | undefined;
  
  console.log(`🔍 Looking up location details...`);
  
  try {
    // Try Google Places API via backend (if configured)
    const richLocationName = await getRichLocationName(latitude, longitude);
    
    if (richLocationName) {
      placeName = richLocationName;
      console.log(`✅ [Google Places] Rich location: ${placeName}`);
    } else {
      console.log(`⚠️ [Google Places] Not available - falling back to basic geocoding`);
      
      // Fallback to basic reverse geocoding (Expo's built-in)
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const result = results[0];
        const parts: string[] = [];
        const usedParts = new Set<string>();
        
        // Build basic location string from available data
        if (result.name && result.name !== result.district && result.name !== result.city) {
          parts.push(result.name);
          usedParts.add(result.name.toLowerCase());
        }
        
        if (result.street && !usedParts.has(result.street.toLowerCase())) {
          const street = result.streetNumber ? `${result.streetNumber} ${result.street}` : result.street;
          parts.push(street);
          usedParts.add(street.toLowerCase());
        }
        
        if (result.district && !usedParts.has(result.district.toLowerCase())) {
          parts.push(result.district);
          usedParts.add(result.district.toLowerCase());
        }
        
        if (result.city && !usedParts.has(result.city.toLowerCase())) {
          parts.push(result.city);
          usedParts.add(result.city.toLowerCase());
        }
        
        if (result.region && !usedParts.has(result.region.toLowerCase()) && result.region !== result.city) {
          parts.push(result.region);
          usedParts.add(result.region.toLowerCase());
        }
        
        placeName = parts.length > 0 ? parts.join(', ') : undefined;
        console.log(`📍 [Basic Geocoding] Location: ${placeName}`);
      }
    }
  } catch (error) {
    console.error('❌ Error getting location details:', error);
  }
  
  console.log(`📍 Final location: ${placeName || 'Unknown'}`);
  console.log(`   Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
  
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
   * NOTE: Disabled by default - too sensitive to small phone movements
   */
  private startMotionBasedTracking(): void {
    // DISABLED: Motion-based tracking is too sensitive
    // It triggers on small phone movements (picking up phone, adjusting position)
    // We only want to log when user has actually traveled 500m+
    // The 10-minute polling is sufficient for this purpose
    return;
    
    /* Original motion tracking code - disabled
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
    */
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
        console.log(`📱 Significant motion detected (change: ${change.toFixed(2)}), checking location...`);
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
   * Uses high accuracy for precise location logging
   */
  private async pollLocation(): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: LOCATION_ACCURACY, // High accuracy for precise location logging
      });
      
      await processLocationUpdate(
        location.coords.latitude,
        location.coords.longitude,
        new Date(location.timestamp)
      );
    } catch (error) {
      // Silently handle location errors (expected when location services unavailable)
      // This is normal in emulator or when user hasn't enabled location
      // Only log in dev mode to avoid spamming
      if (__DEV__) {
        console.log('📍 Location unavailable (this is normal in emulator)');
      }
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
        accuracy: LOCATION_ACCURACY, // High accuracy for precise location logging
        timeInterval: 5 * 60 * 1000, // 5 minutes
        distanceInterval: SIGNIFICANT_DISTANCE_THRESHOLD, // 500 meters - only update when moved 500m
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
