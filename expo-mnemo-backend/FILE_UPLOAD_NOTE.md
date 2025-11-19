# File Upload for ML Model

## Current Limitation

The mobile app sends `audioUri` (local file path) to the backend, but the backend cannot access files on the mobile device directly.

## Solutions

### Option 1: File Upload Endpoint (Recommended for Production)

Create a file upload endpoint that:
1. Accepts audio file from mobile app
2. Saves it temporarily on backend
3. Classifies it with ML model
4. Returns emotion result
5. Optionally deletes temp file

**Implementation:**
```typescript
// routes/emotion.ts
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

router.post('/classify-emotion-upload', upload.single('audio'), async (req, res) => {
  const audioPath = req.file.path;
  const result = await classifyWithModel(audioPath);
  // Clean up temp file
  fs.unlinkSync(audioPath);
  res.json(result);
});
```

**Mobile app:**
```typescript
const formData = new FormData();
formData.append('audio', {
  uri: audioUri,
  type: 'audio/m4a',
  name: 'recording.m4a',
});

const response = await fetch(`${apiUrl}/classify-emotion-upload`, {
  method: 'POST',
  body: formData,
});
```

### Option 2: Use Local Stub (Current)

The app uses local stub classifier when backend can't access the file. This works but doesn't use the ML model.

### Option 3: Shared Storage

Use cloud storage (S3, Firebase Storage) and send URL to backend.

## For Now

The backend will:
- ✅ Use ML model if file is accessible (local testing)
- ✅ Fall back to stub if file is mobile local path
- ✅ Work with stub for development

To use ML model with mobile app, implement Option 1 (file upload).

