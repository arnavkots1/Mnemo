/**
 * Google Places Service (Frontend)
 * 
 * Calls backend API to get rich location data from Google Places
 */

import { API_CONFIG } from '../config/apiConfig';

interface PlaceDetails {
  placeName: string | null;
  placeType: string | null;
  fullAddress: string | null;
  vicinity: string | null;
  rating: number | null;
}

interface LocationLookupResult {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  place: PlaceDetails | null;
  geocode: {
    formattedAddress: string;
    addressComponents: any[];
  } | null;
  locationName: string | null;
}

/**
 * Get rich location name from backend (which uses Google Places API)
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Rich location information or null if backend unavailable
 */
export async function getRichLocationName(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/location/lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({ latitude, longitude }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Google Places] Backend returned ${response.status}`);
      return null;
    }

    const result: LocationLookupResult = await response.json();
    
    if (result.place?.placeName) {
      console.log(`[Google Places] ✅ Found place: ${result.place.placeName}`);
      
      // Build rich location string: "Place Name, Vicinity"
      if (result.place.vicinity && result.place.vicinity !== result.place.placeName) {
        return `${result.place.placeName}, ${result.place.vicinity}`;
      }
      return result.place.placeName;
    }

    if (result.geocode?.formattedAddress) {
      console.log(`[Google Places] 📍 Using address: ${result.geocode.formattedAddress}`);
      return result.geocode.formattedAddress;
    }

    return result.locationName;
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[Google Places] Request timeout - backend not responding');
    } else {
      console.warn('[Google Places] Error fetching location:', error);
    }
    return null;
  }
}

/**
 * Check if Google Places API is available on backend
 */
export async function checkGooglePlacesAvailability(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/location/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.googlePlacesConfigured === true;
    
  } catch (error) {
    return false;
  }
}

