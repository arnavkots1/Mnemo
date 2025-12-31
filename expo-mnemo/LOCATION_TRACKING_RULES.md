# Location Tracking Rules

## Strict Criteria - BOTH Must Be True

A location memory is created **ONLY** when **BOTH** conditions are met:

1. ✅ **Distance**: Moved at least **500 meters** (0.5 km)
2. ✅ **Time**: At least **10 minutes** since last location memory

### Example Scenarios

| Scenario | Distance | Time | Result |
|----------|----------|------|--------|
| Just moved to new place | 600m | 2 min | ❌ Skipped (not enough time) |
| Sitting at home | 10m | 15 min | ❌ Skipped (not enough distance) |
| Walked to nearby store | 600m | 15 min | ✅ **Logged** (both criteria met) |
| Drove across city | 5 km | 20 min | ✅ **Logged** (both criteria met) |

## What You'll See in Logs

### When Skipped
```
📍 Location update skipped:
   Distance moved: 50m ❌ (need 500m+)
   Time passed: 15 min ✅ (need 10min+)
```

### When Logged
```
📍 Location memory will be created:
   ✅ Moved 650m (>500m)
   ✅ 12 minutes passed (>10min)
📍 Location identified: [Place Name], Kondapur, Hyderabad, Telangana
```

## Location Precision

### What We Try to Get (in order of priority):

1. **🏢 Place Name**: Specific building/landmark (e.g., "Phoenix Mall", "ITC Kohenur")
2. **🛣️ Street**: Street number + street name (e.g., "123 Main Street")
3. **🗺️ District**: Neighborhood/area (e.g., "Kondapur")
4. **🏙️ Subregion**: Larger area if useful (e.g., "Rangareddy")
5. **🌆 City**: (e.g., "Hyderabad")
6. **🗾 Region**: State/province (e.g., "Telangana")

### What Google Provides

Google's reverse geocoding database determines precision:
- **In cities**: Usually street-level or better
- **In suburbs**: Often district/neighborhood level
- **In rural areas**: May only have city/region level

Your coordinates (`17.458593, 78.362153`) currently resolve to:
- **Name**: "Kondapur" (area name)
- **District**: "Kondapur"
- **Subregion**: "Rangareddy"
- **City**: "Hyderabad"
- **Region**: "Telangana"

**Result**: `"Kondapur, Rangareddy, Hyderabad, Telangana"`

If you were at a specific landmark (mall, restaurant, office), Google would provide that name.

## How It Works

### Checking Location
- App checks your location **every 10 minutes** (when app is active)
- This is just a CHECK - it doesn't log anything yet

### Creating Memory
- **Calculates** distance from last logged location
- **Checks** if 10+ minutes have passed since last logged location
- **Only logs** if BOTH conditions are true

### Battery Impact
- Minimal - only checks every 10 minutes
- Uses high GPS accuracy for precise coordinates
- Only logs when you've actually moved somewhere new

## Why These Rules?

1. **Prevent spam**: Don't log every tiny movement
2. **Meaningful places**: Only log significant location changes
3. **Privacy**: Less frequent logging
4. **Battery**: Not checking constantly
5. **Useful memories**: Track where you actually went, not every meter moved

## Configuration

Current settings (in `LocationService.ts`):
```typescript
const SIGNIFICANT_DISTANCE_THRESHOLD = 500; // meters (0.5 km)
const FOREGROUND_POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes
const LOCATION_ACCURACY = Location.Accuracy.BestForNavigation; // Highest GPS precision
```

To change:
- **Distance threshold**: Adjust `SIGNIFICANT_DISTANCE_THRESHOLD`
- **Time between checks**: Adjust `FOREGROUND_POLL_INTERVAL`
- **GPS accuracy**: Adjust `LOCATION_ACCURACY`

