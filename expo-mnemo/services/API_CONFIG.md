# API Configuration Guide

## Backend Setup

### 1. Start the Backend Server

```bash
cd expo-mnemo-backend
npm install
npm run dev
```

The server will run on `http://localhost:3000`

### 2. Configure Expo App to Use Backend APIs

Add this to your `App.tsx` or a config file:

```typescript
import { configureEmotionClassifier } from './services/EmotionClassifier';
import { configureImageAnalysis } from './services/imageAnalysisService';

// Configure emotion classifier
configureEmotionClassifier({
  useApi: true,
  apiUrl: 'http://localhost:3000/api',  // For local development
});

// Configure image analysis
configureImageAnalysis({
  useApi: true,
  apiUrl: 'http://localhost:3000/api',  // For local development
});
```

### 3. For Expo Go Testing

Since Expo Go runs on your phone, you need to expose localhost:

**Option A: Use Tunnel Mode**
- Use ngrok or localtunnel to expose localhost:3000
- Configure API URLs to tunnel URL

**Option B: Use Same Network**
- Ensure phone and computer are on same WiFi
- Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Configure API URL: `http://YOUR_IP:3000/api`

**Option C: Deploy Backend**
- Deploy to cloud service (Heroku, Railway, etc.)
- Use deployed URL in configuration

## API Endpoints

### POST /api/classify-emotion
Classifies emotion from audio.

**Request:**
```json
{
  "fakeId": "audio-123"
}
```

**Response:**
```json
{
  "emotion": "happy",
  "confidence": 0.85
}
```

### POST /api/analyze-image
Analyzes image and generates memory summary.

**Request:**
```json
{
  "imageUri": "file:///path/to/image.jpg",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "placeName": "New York"
  },
  "timeOfDay": "afternoon",
  "dayOfWeek": "Saturday"
}
```

**Response:**
```json
{
  "summary": "Afternoon photo at New York",
  "description": "A memorable moment captured. Afternoon photo at New York",
  "tags": ["photo", "location"],
  "confidence": 0.85
}
```

## Fallback Behavior

Both services automatically fall back to local stub implementations if:
- API is not configured (`useApi: false`)
- API request fails
- API is unavailable

This ensures the app continues working even without backend.
