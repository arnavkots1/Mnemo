# Architecture Explanation

## How It Works

### 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Mobile App    │────────▶│   Backend Server │────────▶│   ML Model      │
│   (Expo Go)     │  HTTP   │   (Node.js)      │  Python │   (TensorFlow)  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
     Records Audio              Receives Request            Classifies Emotion
     Sends to Backend           Loads Model                 Returns Result
     Displays Result            Returns to App
```

### 📱 Mobile App (Expo)

**What it does:**
- Records audio during Capture Session
- Sends audio file to backend
- Receives emotion classification
- Displays results in Moments tab

**What it CAN'T do:**
- ❌ Run Python/TensorFlow models directly
- ❌ Process ML models in Expo Go (limited runtime)

**Why?**
- Expo Go runs JavaScript/TypeScript only
- ML models need Python + TensorFlow (too heavy for mobile)
- Would need native modules (not available in Expo Go)

### 🖥️ Backend Server (Node.js)

**What it does:**
- ✅ Receives audio files from mobile app
- ✅ Loads ML model on startup (automatic)
- ✅ Calls Python script to classify emotion
- ✅ Returns emotion + confidence to app

**Auto-loads model:**
- When backend starts → checks for `ml_model/saved_model/emotion_model.h5`
- If found → model is ready to use
- If not found → uses stub classifier

### 🤖 ML Model (Python/TensorFlow)

**What it does:**
- Trained CNN model for emotion classification
- Runs on backend server (not in mobile app)
- Processes audio mel spectrograms
- Returns emotion probabilities

**Location:**
- Lives on backend server: `expo-mnemo-backend/ml_model/`
- Trained model saved: `saved_model/emotion_model.h5`
- Loaded automatically when backend starts

---

## 🔄 Flow Example

### 1. User Starts Capture Session
```
Mobile App → Records audio → Saves to device
```

### 2. App Analyzes Audio (Every 10 seconds)
```
Mobile App → Sends audioUri to Backend → Backend receives request
```

### 3. Backend Classifies Emotion
```
Backend → Checks if model loaded → Calls Python script → ML Model processes → Returns emotion
```

### 4. App Receives Result
```
Backend → Returns {emotion: "happy", confidence: 0.85} → Mobile App → Shows alert
```

---

## ✅ Auto-Loading Setup

### Backend Auto-Loads Model

**On Backend Startup:**
```typescript
// server.ts
initializeModel(); // Checks for model, loads if available
```

**What happens:**
- ✅ Checks for `ml_model/saved_model/emotion_model.h5`
- ✅ If found → Model ready for API requests
- ✅ If not found → Uses stub (still works, just not ML)

### App Auto-Configures Backend

**On App Startup:**
```typescript
// App.tsx
initializeApiConfig(); // Configures backend URL
```

**What happens:**
- ✅ Sets backend API URL
- ✅ Enables API usage for emotion & image services
- ✅ App will use backend when available

---

## 🚀 How to Use

### Step 1: Train Model (One Time)

```bash
cd expo-mnemo-backend/ml_model
pip install -r requirements.txt
python train_emotion_model.py
```

**Result:** Model saved to `saved_model/emotion_model.h5`

### Step 2: Start Backend

```bash
cd expo-mnemo-backend
npm run dev
```

**What happens:**
- ✅ Backend starts
- ✅ Auto-checks for model
- ✅ If found → "✅ ML Model found and ready"
- ✅ If not → "⚠️ Using stub classifier"

### Step 3: Configure App IP

**Edit `expo-mnemo/config/apiConfig.ts`:**
```typescript
const BACKEND_API_URL = 'http://YOUR_COMPUTER_IP:3000/api';
```

**Find your IP:**
- Windows: `ipconfig` → Look for IPv4 Address
- Mac/Linux: `ifconfig` → Look for inet address

### Step 4: Start App

```bash
cd expo-mnemo
npx expo start
```

**What happens:**
- ✅ App starts
- ✅ Auto-configures backend connection
- ✅ Uses backend for emotion classification

---

## ❓ Why Not Run Model in App?

### Technical Limitations

1. **Expo Go Runtime:**
   - Only runs JavaScript/TypeScript
   - Can't run Python code
   - Can't load TensorFlow models directly

2. **Model Size:**
   - TensorFlow models are large (MBs)
   - Would bloat app size
   - Slow to load on mobile

3. **Performance:**
   - ML inference is CPU/GPU intensive
   - Better on server with more resources
   - Mobile battery drain

### Alternative (Future)

**For Production Build:**
- Could use TensorFlow.js (JavaScript ML)
- Would work in production builds
- Still heavier than server-side
- Current approach (backend) is better

---

## 📝 Summary

✅ **Model loads automatically** when backend starts  
✅ **App connects automatically** to backend on startup  
✅ **Everything works together** seamlessly  

**The model runs on the backend, not in the app** - this is the correct architecture! 🎯

