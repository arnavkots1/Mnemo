# Emotion Detection - How It Works

## Current Implementation (Stub/Development)

### ⚠️ Important: No Real ML Model Yet

**Current Status:** The app uses **stub logic** (simulated emotion detection) for development. There is **no real ML model** running yet.

---

## How Emotion Detection Currently Works

### 1. **Automatic Detection (No Button Needed)**

When you start a Capture Session:
- Recording starts automatically
- Every **10 seconds**, the app automatically:
  1. Analyzes the current audio recording
  2. Classifies the emotion
  3. If emotion is "happy" or "surprised" → **Automatically saves a memory**
  4. Shows an alert notification

**You don't need to click anything** - it happens automatically!

### 2. **Current Detection Logic (Stub)**

The app uses **simulated logic** based on audio properties:

**Local Stub (Default):**
- **High volume** (>0.7) → Biased towards "happy" or "surprised"
- **Medium volume** (0.4-0.7) → "neutral" or "happy"
- **Low volume** (<0.4) → "sad" or "neutral"
- **Long recordings** (>15 sec) → More likely "happy"
- **Short recordings** (<5 sec) → Random emotion

**Backend API (If Configured):**
- Currently returns **70% "happy", 30% random** (stub)
- In production, this would run a real ML model

### 3. **What Triggers Memory Creation**

**Trigger Emotions:** Only `happy` and `surprised` automatically create memories

**Other Emotions:** Detected but not saved (you'd see them in the UI but no memory created)

**Why?** This prevents saving every single moment - only the "positive" emotional moments are automatically captured.

---

## Backend - What It Does

### Original Purpose
The backend was created to:
1. **Classify emotions from audio** using ML models
2. **Analyze images** to generate memory summaries

### Current Status
- ✅ Backend server exists (`expo-mnemo-backend/`)
- ✅ Endpoints implemented (stub versions)
- ❌ **No real ML model** - uses random/stub logic
- ⚠️ Backend is **optional** - app works without it

### Backend Endpoints

**1. Emotion Classification** (`POST /api/classify-emotion`)
- **Input:** Audio file URL or fake ID
- **Output:** Emotion type + confidence score
- **Current:** Returns random emotions (70% happy)
- **Future:** Would run real ML model on audio

**2. Image Analysis** (`POST /api/analyze-image`)
- **Input:** Image URL/URI + context (location, time)
- **Output:** Summary, description, tags
- **Current:** Generates context-aware summaries
- **Future:** Would use vision models (GPT-4 Vision, CLIP, etc.)

---

## How to Add Real ML Model

### Option 1: Use Existing ML Services

**For Emotion Detection:**
- Google Cloud Speech-to-Text + Sentiment Analysis
- AWS Transcribe + Comprehend
- Azure Speech Services
- Or train your own model (TensorFlow, PyTorch)

**For Image Analysis:**
- GPT-4 Vision API
- Google Cloud Vision API
- AWS Rekognition
- CLIP models

### Option 2: Train Your Own Model

**Emotion Detection:**
1. Collect audio dataset with emotion labels
2. Train model (e.g., using librosa features + CNN/LSTM)
3. Export model (TensorFlow Lite, ONNX, etc.)
4. Deploy to backend or use Core ML (iOS)

**Image Analysis:**
1. Use pre-trained vision models
2. Fine-tune for your use case
3. Deploy to backend

### Option 3: Use Core ML (iOS Native)

For iOS, you could:
1. Train model in Python
2. Convert to Core ML format
3. Use directly in iOS app (no backend needed)

---

## Current Flow Diagram

```
User starts Capture Session
    ↓
Recording starts automatically
    ↓
Every 10 seconds:
    ↓
1. Get audio duration & volume (simulated)
    ↓
2. Call classifyEmotion()
    ├─ If backend configured → Call API (stub: 70% happy)
    └─ Otherwise → Use local stub (volume-based logic)
    ↓
3. Get emotion result (happy, sad, angry, surprised, neutral)
    ↓
4. Check if emotion is "happy" or "surprised"
    ├─ YES → Automatically create memory + show alert
    └─ NO → Just display emotion, don't save
    ↓
5. Continue recording...
    ↓
User taps "End Session" → Stop recording
```

---

## What You See

**During Session:**
- Timer showing session duration
- Last detected emotion displayed
- "Analyzing..." indicator every 10 seconds

**When Emotion Detected:**
- Alert pops up: "Emotional Moment Captured! Happy moment detected and saved."
- Memory automatically added to Moments tab
- Audio file saved permanently

**In Moments Tab:**
- Filter by "Audio" to see all emotional memories
- Each shows emotion type, timestamp, and audio recording

---

## Summary

**Current State:**
- ✅ Automatic detection (every 10 seconds)
- ✅ Only saves "happy" and "surprised" moments
- ✅ Uses stub logic (no real ML model)
- ✅ Works without backend (local stub)
- ✅ Backend available but optional

**Future State (With Real ML):**
- Real emotion detection from audio features
- More accurate classifications
- Could detect all emotions, not just happy/surprised
- Could use speech-to-text for transcripts

**No Button Needed:** Everything happens automatically! 🎉

