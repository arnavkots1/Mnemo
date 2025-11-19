# Mnemo Backend API

Optional backend server for emotion classification API.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### POST /api/classify-emotion

Classifies emotion from audio.

**Request Body:**
```json
{
  "audioUrl": "https://example.com/audio.mp3"
}
```

Or for development/testing:
```json
{
  "fakeId": "test-123"
}
```

**Response:**
```json
{
  "emotion": "happy",
  "confidence": 0.85
}
```

**Emotion Types:**
- `happy`
- `sad`
- `angry`
- `surprised`
- `neutral`

## Development

The server runs on `http://localhost:3000` by default.

For Expo app to connect:
- Use tunnel mode: `expo start --tunnel`
- Or ensure phone and computer are on same network
- Update API URL in `emotionClassifier.ts`

## Production

In production, replace the stub implementation with:
- Real ML model inference
- Audio processing pipeline
- Authentication/rate limiting
- Error handling and logging

