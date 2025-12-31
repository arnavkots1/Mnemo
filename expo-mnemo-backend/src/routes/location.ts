/**
 * Location API Routes
 * 
 * Provides rich location lookup using Google Places API
 */

import express from 'express';
import { findNearestPlace, getRichLocationName, reverseGeocode } from '../services/googlePlacesService';

const router = express.Router();

/**
 * POST /api/location/lookup
 * 
 * Get rich location information for coordinates
 * Returns place name, address, and details from Google Places API
 */
router.post('/lookup', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Missing latitude or longitude' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    console.log(`[Location API] 📍 Looking up location: ${lat}, ${lon}`);

    // Try to find a specific place nearby (within 50m)
    const place = await findNearestPlace(lat, lon);
    
    // Get detailed address as fallback
    const geocode = await reverseGeocode(lat, lon);

    const result = {
      coordinates: { latitude: lat, longitude: lon },
      place: place || null,
      geocode: geocode ? {
        formattedAddress: geocode.formatted_address,
        addressComponents: geocode.address_components,
      } : null,
      // Provide a best-guess location string
      locationName: place?.placeName || geocode?.formatted_address || null,
    };

    console.log(`[Location API] ✅ Result: ${result.locationName || 'No location found'}`);

    res.json(result);
  } catch (error) {
    console.error('[Location API] Error:', error);
    res.status(500).json({ error: 'Failed to lookup location' });
  }
});

/**
 * GET /api/location/health
 * 
 * Check if Google Places API is configured
 */
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.GOOGLE_MAPS_API_KEY;
  
  res.json({
    googlePlacesConfigured: hasApiKey,
    message: hasApiKey 
      ? 'Google Places API is configured' 
      : 'Google Places API key not set - using basic geocoding only',
  });
});

export default router;

