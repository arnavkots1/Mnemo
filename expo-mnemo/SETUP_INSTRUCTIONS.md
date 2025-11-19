# Quick Setup Instructions

## ✅ Everything Auto-Loads Now!

Both the **backend** and **app** automatically configure themselves on startup.

---

## 🚀 Quick Start

### 1. Train the Model (One Time)

```bash
cd expo-mnemo-backend/ml_model
pip install -r requirements.txt
python train_emotion_model.py
```

**Result:** Model saved to `saved_model/emotion_model.h5`

### 2. Configure Your IP Address

**Edit `expo-mnemo/config/apiConfig.ts`:**

```typescript
const BACKEND_API_URL = 'http://YOUR_IP:3000/api';
```

**Find your IP:**
- **Windows:** Run `ipconfig` → Look for "IPv4 Address"
- **Mac/Linux:** Run `ifconfig` → Look for "inet" address
- **Example:** `http://192.168.1.100:3000/api`

### 3. Start Backend

```bash
cd expo-mnemo-backend
npm run dev
```

**You'll see:**
```
🔧 Initializing ML model...
✅ ML Model found and ready: .../emotion_model.h5
   Model will be used for emotion classification
🚀 Mnemo backend server running on http://localhost:3000
```

**OR if model not trained yet:**
```
🔧 Initializing ML model...
⚠️  ML Model not found: .../emotion_model.h5
   Using stub classifier (run train_emotion_model.py to train model)
🚀 Mnemo backend server running on http://localhost:3000
```

### 4. Start App

```bash
cd expo-mnemo
npx expo start
```

**What happens:**
- ✅ App starts
- ✅ Auto-configures backend connection
- ✅ Uses backend for emotion classification

---

## 🔄 How It Works

### Backend Auto-Loads Model

When backend starts:
1. Checks for `ml_model/saved_model/emotion_model.h5`
2. If found → Model ready ✅
3. If not found → Uses stub (still works) ⚠️

### App Auto-Connects to Backend

When app starts:
1. Reads `config/apiConfig.ts`
2. Configures emotion & image services
3. All API calls go to backend automatically

---

## 📱 Testing

1. **Start Capture Session** in app
2. **Record audio** (it analyzes every 10 seconds)
3. **Check backend console** - should see classification requests
4. **Check Moments tab** - should see emotional memories

---

## ❓ Troubleshooting

### Backend says "Model not found"
- Train the model first (Step 1 above)
- Make sure `saved_model/emotion_model.h5` exists

### App can't connect to backend
- Check IP address in `config/apiConfig.ts`
- Make sure phone and computer are on same WiFi
- Check backend is running (`npm run dev`)

### Still using stub instead of ML model
- Backend can't access mobile device files directly
- Need file upload (see `expo-mnemo-backend/FILE_UPLOAD_NOTE.md`)
- For now, stub works fine for development

---

## 🎯 Summary

✅ **Model loads automatically** when backend starts  
✅ **App connects automatically** to backend  
✅ **Everything works together** seamlessly  

Just train the model once, configure your IP, and start both servers! 🚀

