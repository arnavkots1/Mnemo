/**
 * Google Places API Service
 * 
 * Uses Google Places API to find nearby businesses, landmarks, and POIs
 * This provides much richer location data than basic reverse geocoding
 */

import { Client, PlaceType1, PlaceType2 } from '@googlemaps/google-maps-services-js';

const client = new Client({});

interface PlaceDetails {
  placeName: string | null;
  placeType: string | null;
  fullAddress: string | null;
  vicinity: string | null;
  rating: number | null;
}

/**
 * Find the nearest place (business, landmark, POI) at given coordinates
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Detailed place information or null if not found
 */
export async function findNearestPlace(
  latitude: number,
  longitude: number
): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('[Google Places] ⚠️ GOOGLE_MAPS_API_KEY not set - skipping Places API lookup');
    return null;
  }

  try {
    console.log(`[Google Places] 🔍 Searching for places near ${latitude}, ${longitude}`);
    
    // Search for nearby places within 50 meters
    // This finds businesses, landmarks, stores, restaurants, etc.
    const response = await client.placesNearby({
      params: {
        location: { lat: latitude, lng: longitude },
        radius: 50, // 50 meters - very close to exact location
        key: apiKey,
        rankby: undefined, // Use prominence ranking (default)
      },
      timeout: 5000, // 5 second timeout
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('[Google Places] ❌ API error:', response.data.status, response.data.error_message);
      return null;
    }

    if (!response.data.results || response.data.results.length === 0) {
      console.log('[Google Places] 📍 No specific places found at this location');
      return null;
    }

    // Get the closest/most prominent place
    const place = response.data.results[0];
    
    const details: PlaceDetails = {
      placeName: place.name || null,
      placeType: place.types ? place.types[0] : null,
      fullAddress: place.vicinity || null,
      vicinity: place.vicinity || null,
      rating: place.rating || null,
    };

    console.log(`[Google Places] ✅ Found place: "${details.placeName}"`);
    if (details.placeType) {
      console.log(`   Type: ${details.placeType}`);
    }
    if (details.vicinity) {
      console.log(`   Address: ${details.vicinity}`);
    }

    return details;
    
  } catch (error) {
    console.error('[Google Places] Error searching for places:', error);
    return null;
  }
}

/**
 * Get detailed address information for coordinates
 * Falls back to this if no specific place is found nearby
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<any> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('[Google Places] ⚠️ GOOGLE_MAPS_API_KEY not set - cannot reverse geocode');
    return null;
  }

  try {
    const response = await client.reverseGeocode({
      params: {
        latlng: { lat: latitude, lng: longitude },
        key: apiKey,
      },
      timeout: 5000,
    });

    if (response.data.status !== 'OK') {
      console.error('[Google Places] ❌ Reverse geocode error:', response.data.status);
      return null;
    }

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0];
    }

    return null;
  } catch (error) {
    console.error('[Google Places] Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Get rich location string combining Places API and geocoding
 * 
 * This is the main function to use - it tries Places API first,
 * then falls back to detailed geocoding
 */
export async function getRichLocationName(
  latitude: number,
  longitude: number
): Promise<string | null> {
  // Try to find a specific place first (mall, restaurant, office, etc.)
  const place = await findNearestPlace(latitude, longitude);
  
  if (place && place.placeName) {
    // Found a specific place!
    return place.placeName;
  }

  // No specific place found - use detailed address instead
  const geocode = await reverseGeocode(latitude, longitude);
  
  if (geocode && geocode.formatted_address) {
    return geocode.formatted_address;
  }

  return null;
}

/**
 * Format a human-readable location string with as much detail as possible
 */
export function formatLocationString(
  placeName: string | null,
  placeType: string | null,
  vicinity: string | null
): string {
  const parts: string[] = [];
  
  if (placeName) {
    parts.push(placeName);
  }
  
  if (vicinity && vicinity !== placeName) {
    parts.push(vicinity);
  }
  
  return parts.join(', ') || 'Unknown Location';
}

