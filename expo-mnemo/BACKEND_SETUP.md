# Backend Setup Instructions

## Quick Start

### 1. Start Backend Server

Open a **new terminal window** and run:

```bash
cd expo-mnemo-backend
npm install
npm run dev
```

You should see:
```
🚀 Mnemo backend server running on http://localhost:3000
📡 Emotion API: http://localhost:3000/api/classify-emotion
🖼️  Image API: http://localhost:3000/api/analyze-image
```

### 2. Configure Expo App (Optional)

The app works without the backend (uses local stubs). To use the backend:

**For Local Development (Same Network):**
1. Find your computer's IP address:
   - Windows: `ipconfig` → Look for "IPv4 Address"
   - Mac/Linux: `ifconfig` → Look for inet address
   
2. Update `App.tsx` to configure APIs:
```typescript
import { configureEmotionClassifier } from './services/EmotionClassifier';
import { configureImageAnalysis } from './services/imageAnalysisService';

// Add this in App.tsx or a config file
useEffect(() => {
  // Replace YOUR_IP with your actual IP (e.g., 192.168.1.100)
  configureEmotionClassifier({
    useApi: true,
    apiUrl: 'http://YOUR_IP:3000/api',
  });
  
  configureImageAnalysis({
    useApi: true,
    apiUrl: 'http://YOUR_IP:3000/api',
  });
}, []);
```

**For Tunnel Mode:**
- Use ngrok: `ngrok http 3000`
- Use the ngrok URL in configuration

### 3. Test Backend

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Test Image Analysis:**
```bash
curl -X POST http://localhost:3000/api/analyze-image \
  -H "Content-Type: application/json" \
  -d '{"fakeId": "test-123", "timeOfDay": "afternoon", "location": {"latitude": 40.7128, "longitude": -74.0060}}'
```

## What the Backend Does

### Image Analysis API
- Generates context-aware summaries from images
- Uses location, time of day, and day of week context
- Returns summary, description, and tags

### Emotion Classification API  
- Classifies emotions from audio recordings
- Returns emotion type and confidence score

## Current Status

- ✅ Backend server created
- ✅ Image analysis endpoint implemented (stub)
- ✅ Emotion classification endpoint implemented (stub)
- ⚠️ Expo app uses local stubs by default
- ⚠️ Backend needs to be started manually
- ⚠️ API configuration needed to use backend

## Next Steps

1. **Start backend** (see Quick Start above)
2. **Configure Expo app** to use backend APIs (optional)
3. **Test image import** - should use backend for analysis
4. **Test audio capture** - should use backend for emotion classification

The app will automatically fall back to local stubs if backend is unavailable.

