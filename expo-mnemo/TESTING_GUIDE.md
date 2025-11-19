# Testing Guide for Mnemo

## Current Issues

The app is experiencing import/export issues with the store functions. Here's how to test features once the bundler cache is cleared.

## Recommended Testing Order

### 1. **Photo Import** (Easiest to Test)
**Why first:** Doesn't require permissions or background services. Simple manual action.

**Steps:**
1. Go to **Moments** tab
2. Tap **"Import from Photos"**
3. Select 1-2 photos
4. Check if they appear in Moments screen
5. Check if they appear in Today screen

**Expected:** Photos should appear and persist after app restart.

---

### 2. **Settings Toggle** (Verify Persistence)
**Why second:** Tests that settings are saving correctly.

**Steps:**
1. Go to **Settings** tab
2. Toggle **"Enable Passive Context Logging"** OFF
3. Close and reopen app
4. Check if toggle is still OFF

**Expected:** Settings should persist.

---

### 3. **Emotional Capture Session** (Requires Mic Permission)
**Why third:** Tests audio recording and emotion classification.

**Steps:**
1. Go to **Today** tab
2. Tap **"Start Emotional Capture"**
3. Grant microphone permission if prompted
4. Speak or make sounds for 10+ seconds
5. Wait for emotion detection (should show toast if happy/surprised)
6. Tap **"End Session"**

**Expected:** Emotional memories should appear if trigger emotions detected.

---

### 4. **Passive Context Logging** (Location Permission Required)
**Why last:** Most complex, requires location permissions and movement.

**Steps:**
1. Go to **Settings** tab
2. Ensure **"Enable Passive Context Logging"** is ON
3. Grant location permission if prompted
4. Move >100 meters (or wait 5 minutes if already moved)
5. Check **Today** tab for context memories

**Expected:** Context memories should appear when you move significantly.

---

## Troubleshooting

### If memories appear then disappear:
- This suggests the store functions aren't working
- Memories are only in local state (React state)
- They get lost on app refresh/reload
- **Fix:** Clear Metro bundler cache and restart

### If you see import errors:
1. Stop the Metro bundler (Ctrl+C)
2. Run: `npx expo start --clear`
3. Reload the app in Expo Go

### If location memories aren't appearing:
- Check Settings → "Enable Passive Context Logging" is ON
- Grant location permission when prompted
- Move >100 meters from your starting location
- Wait up to 5 minutes (foreground polling interval)

---

## Quick Test: Photo Import

**Fastest way to verify the app is working:**

1. Open **Moments** tab
2. Tap **"Import from Photos"**
3. Select a photo
4. Check if it appears in Moments
5. Check if it appears in Today

If this works, the core functionality is working and you can test other features.

