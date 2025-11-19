# Next Steps - Testing Mnemo Features

Great! Photo import is working. Let's test the other features:

## ✅ Completed
- [x] Photo Import - Working! Photos are being saved.

## 🧪 Next Tests

### 1. **Verify Photo Persistence** (Quick Test)
**Goal:** Make sure photos survive app reload

**Steps:**
1. See your 3 photos in Moments tab
2. Close Expo Go completely (swipe away from app switcher)
3. Reopen Expo Go and scan QR code again
4. Go to Moments tab
5. **Expected:** Your 3 photos should still be there

---

### 2. **Test Settings Persistence** (Quick Test)
**Goal:** Verify settings are saved correctly

**Steps:**
1. Go to **Settings** tab
2. Toggle **"Enable Passive Context Logging"** to OFF
3. Close and reopen the app
4. Go back to Settings
5. **Expected:** Toggle should still be OFF

---

### 3. **Test Emotional Capture Session** (Requires Mic Permission)
**Goal:** Test audio recording and emotion detection

**Steps:**
1. Go to **Today** tab
2. Tap **"Start Emotional Capture"**
3. Grant microphone permission when prompted
4. Speak or make sounds for 10+ seconds
5. Wait for emotion detection (should show toast if happy/surprised detected)
6. Tap **"End Session"**
7. **Expected:** 
   - Emotional memories should appear in Today tab
   - Should also appear in Moments tab

**Note:** The emotion classifier is a stub - it randomly assigns emotions, biased towards 'happy' for high volume.

---

### 4. **Test Passive Context Logging** (Requires Location Permission)
**Goal:** Test location tracking and context memory creation

**Steps:**
1. Go to **Settings** tab
2. Ensure **"Enable Passive Context Logging"** is ON
3. Grant location permission when prompted
4. Move >100 meters from your current location (or wait 5 minutes)
5. Check **Today** tab
6. **Expected:** Context memories should appear showing your location

**Note:** In Expo Go, this only works when the app is in the foreground (foreground polling every 5 minutes).

---

### 5. **Test Today Screen** (Verify Display)
**Goal:** See all memories in timeline

**Steps:**
1. Go to **Today** tab
2. **Expected:** Should see:
   - Photo memories (if imported today)
   - Context memories (if location logging created any)
   - Emotional memories (if capture session created any)
   - All sorted by time

---

## 🎯 Recommended Testing Order

1. **Photo Persistence** (1 min) - Quick verification
2. **Settings Persistence** (1 min) - Quick verification  
3. **Emotional Capture** (2-3 min) - Core feature test
4. **Passive Context Logging** (5+ min) - Requires movement/time
5. **Today Screen** (1 min) - Visual verification

---

## 🐛 If Something Doesn't Work

**Photos not persisting:**
- Check console for errors
- Verify AsyncStorage is working (check Settings persistence)

**Emotional Capture not working:**
- Check microphone permission in Settings
- Verify "Allow Audio-based Emotional Capture" is ON in Settings

**Context Logging not working:**
- Check location permission
- Verify "Enable Passive Context Logging" is ON
- Remember: In Expo Go, only works when app is open (foreground)

**Memories not appearing:**
- Pull down to refresh on Today/Moments screens
- Check console for errors
- Verify memories are being added (check console logs)

---

## 📊 Current Status

- ✅ Core app structure working
- ✅ Photo import working
- ✅ Store functions working (after import fix)
- ⚠️ Background location limited in Expo Go (expected)
- ⚠️ Some deprecation warnings (informational only)

**All core features should be functional!**

