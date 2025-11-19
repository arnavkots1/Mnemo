# Testing Checklist

## ✅ Already Working
- [x] Audio recording saves when session ends
- [x] Recordings appear in Moments tab
- [x] Can play audio recordings
- [x] Can see emotion labels (happy, neutral, etc.)
- [x] Filter by Audio/Locations/Images works
- [x] Backend connection (even if using stub)

---

## 🧪 Next Features to Test

### 1. **Photo Import & Analysis** 📷
**Location:** Moments tab → "Import from Photos" button

**Test Steps:**
1. Go to Moments tab
2. Tap "Import from Photos"
3. Select 2-3 photos
4. Check if they appear in Moments
5. Verify:
   - ✅ Photos show thumbnails
   - ✅ Timestamps are correct (from EXIF)
   - ✅ Location names appear (if photos have GPS)
   - ✅ AI-generated summaries appear (if backend is running)

**Expected:**
- Photos appear grouped by date
- Backend generates summaries (if running)
- Falls back to local summaries if backend off

---

### 2. **Passive Context Logging** 📍
**Location:** Settings tab → "Enable Passive Context Logging" toggle

**Test Steps:**
1. Go to Settings tab
2. Enable "Passive Context Logging"
3. Grant location permissions when prompted
4. Move around (walk >100m)
5. Check Moments tab → Filter by "Locations"

**Expected:**
- ✅ Location memories appear automatically
- ✅ Place names are reverse geocoded
- ✅ Shows "Moved to new area" or similar summaries
- ✅ Memories grouped by date

**Note:** In Expo Go, background location is limited (foreground-only)

---

### 3. **Settings & Privacy** ⚙️
**Location:** Settings tab

**Test Steps:**
1. Toggle "Enable Passive Context Logging" on/off
2. Toggle "Use Activity Detection" (stored for future)
3. Toggle "Allow Audio-based Emotional Capture"
4. Try starting capture session when disabled → Should show warning
5. Test "Delete All Data" button → Should clear everything

**Expected:**
- ✅ Toggles persist after app restart
- ✅ Services start/stop based on toggles
- ✅ Delete All Data clears memories and resets settings

---

### 4. **Emotion Detection During Session** 🎤
**Location:** Capture tab → Start Emotional Capture

**Test Steps:**
1. Start capture session
2. Wait 10+ seconds (automatic analysis happens)
3. Make some noise/laugh (high volume)
4. Check if "happy" moment is detected automatically
5. End session

**Expected:**
- ✅ Every 10 seconds, emotion is analyzed
- ✅ "Happy" or "Surprised" emotions trigger automatic memory creation
- ✅ Alert appears when emotional moment detected
- ✅ Final recording saved when session ends

---

### 5. **Calendar View & Filtering** 📅
**Location:** Moments tab

**Test Steps:**
1. Create memories of different types (audio, photos, locations)
2. Check date headers ("Today", "Yesterday", etc.)
3. Test filters:
   - "All" → Shows everything
   - "Images" → Only photos
   - "Locations" → Only location memories
   - "Audio" → Only emotional recordings
4. Verify counts in filter tabs are correct

**Expected:**
- ✅ Memories grouped by date correctly
- ✅ Filters work correctly
- ✅ Counts match actual memories
- ✅ "moments" (not "memories") shown in date headers

---

### 6. **Backend ML Model (If Implemented)** 🤖
**Prerequisites:** File upload endpoint implemented

**Test Steps:**
1. Train model: `cd expo-mnemo-backend/ml_model && python train_emotion_model.py`
2. Start backend: `cd expo-mnemo-backend && npm run dev`
3. Implement file upload (see `FILE_UPLOAD_NOTE.md`)
4. Record audio in app
5. Check backend logs for ML model usage

**Expected:**
- ✅ Backend uses ML model instead of stub
- ✅ More accurate emotion detection
- ✅ Confidence scores from model

---

## 🐛 Known Issues / Limitations

### Current Limitations:
1. **Backend uses stub** - File upload needed for ML model (see `FILE_UPLOAD_NOTE.md`)
2. **Background location** - Limited in Expo Go (foreground-only)
3. **Deprecated APIs** - Some warnings expected (FileSystem, ImagePicker, Expo AV)

### Expected Warnings:
- `Background location is limited in Expo Go` - Normal, expected
- `[expo-image-picker] MediaTypeOptions deprecated` - Normal, using legacy API
- `[expo-av] Expo AV deprecated` - Normal, will migrate to expo-audio later

---

## 📊 Test Results Template

```
Date: ___________

✅ Audio Recording:
- [ ] Records successfully
- [ ] Saves when session ends
- [ ] Appears in Moments
- [ ] Can play audio
- [ ] Emotion label correct

✅ Photo Import:
- [ ] Can select photos
- [ ] Photos appear in Moments
- [ ] Thumbnails load
- [ ] Timestamps correct
- [ ] Summaries generated

✅ Location Logging:
- [ ] Toggle works
- [ ] Permissions requested
- [ ] Memories created
- [ ] Place names appear

✅ Settings:
- [ ] Toggles persist
- [ ] Services start/stop
- [ ] Delete All Data works

✅ Filtering:
- [ ] All filter works
- [ ] Images filter works
- [ ] Locations filter works
- [ ] Audio filter works
- [ ] Counts correct
```

---

## 🎯 Priority Testing Order

1. **Photo Import** (Quick to test, visual feedback)
2. **Settings Toggles** (Verify persistence)
3. **Location Logging** (Core feature)
4. **Emotion Detection** (During session, automatic)
5. **Filtering** (UI/UX verification)
6. **File Upload** (If implementing ML model)

---

## 💡 Tips

- **Backend off is fine** - App works with local stubs
- **Check console logs** - Shows what's happening
- **Test on real device** - Better than simulator for location/audio
- **Grant permissions** - Location, microphone, photos needed
- **Move around** - For location logging to trigger (>100m movement)

