# Google Places API Setup

## Why Google Places API?

The basic reverse geocoding (built into Expo) only provides generic location data like:
- `"Kondapur, Hyderabad, Telangana"`

With **Google Places API**, you get specific place names like:
- `"Phoenix Mall, Kondapur, Hyderabad"`
- `"Starbucks, HITEC City, Hyderabad"`
- `"ITC Kohenur Hotel, Madhapur, Hyderabad"`

## Setup Steps

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Places API** and **Geocoding API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Places API" → Enable
   - Search for "Geocoding API" → Enable
4. Create API Key:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key

### 2. Restrict API Key (Important for Security)

1. Click on your API key to edit it
2. Under "API restrictions":
   - Select "Restrict key"
   - Check only:
     - ✅ Places API
     - ✅ Geocoding API
3. Under "Application restrictions":
   - Select "IP addresses" (for backend server)
   - Or "None" for development (restrict later for production)
4. Save

### 3. Add API Key to Backend

In `expo-mnemo-backend/.env`, add:

```env
GEMINI_API_KEY=your_existing_gemini_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 4. Restart Backend

```bash
cd expo-mnemo-backend
npm run dev
```

You should see:
```
✅ Google Places API configured
```

## How It Works

### Without Google Places API
```
📍 Location: Kondapur, Hyderabad, Telangana
```

### With Google Places API
```
🔍 Looking up location details...
✅ [Google Places] Rich location: Phoenix Mall, Kondapur, Hyderabad
📍 Final location: Phoenix Mall, Kondapur, Hyderabad
```

## API Usage & Costs

### Free Tier
- **$200 free credit per month** (enough for ~28,000 requests)
- Places Nearby: $0.032 per request
- Geocoding: $0.005 per request

### Your Usage
With current settings:
- Location checked every 10 minutes
- Only logs if moved 500m+ AND 10+ minutes passed
- Estimated: ~50-100 requests per day = **~$2-4/month** (well within free tier)

### Rate Limiting
The backend automatically:
- Uses 50m radius (smallest possible) to reduce costs
- 5 second timeout to prevent hanging requests
- Falls back to basic geocoding if API fails

## Testing

### 1. Check if API is configured:
```bash
curl http://localhost:3000/api/location/health
```

Should return:
```json
{
  "googlePlacesConfigured": true,
  "message": "Google Places API is configured"
}
```

### 2. Test location lookup:
```bash
curl -X POST http://localhost:3000/api/location/lookup \
  -H "Content-Type: application/json" \
  -d '{"latitude": 17.4326, "longitude": 78.4071}'
```

Should return place details for that coordinate.

### 3. In the app:
- Go to a mall, restaurant, or office
- Wait for location update (10 min + 500m movement)
- Check logs for:
  ```
  ✅ [Google Places] Found place: Phoenix Mall
  ```

## Troubleshooting

### "GOOGLE_MAPS_API_KEY not set"
- Add the key to `expo-mnemo-backend/.env`
- Restart the backend server

### "API error: REQUEST_DENIED"
- Check that Places API and Geocoding API are enabled in Google Cloud Console
- Check that API key restrictions allow these APIs

### "OVER_QUERY_LIMIT"
- You've exceeded the free tier
- Check usage in Google Cloud Console
- Consider increasing radius or reducing check frequency

### Still showing basic locations
- Make sure you're at a specific place (mall, restaurant, office)
- Generic residential areas may not have specific place names in Google's database
- Check backend logs to see if Places API is being called

## Fallback Behavior

If Google Places API is not configured or fails:
1. App tries Google Places API first
2. If unavailable, falls back to basic Expo geocoding
3. Still provides location, just less detailed

This ensures the app works even without the API key!

