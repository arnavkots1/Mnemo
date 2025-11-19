# Backend, Audio Storage, and Permissions Guide

## 1. Backend Status

### Is the Backend Running?

**Current Status:** The backend is **not automatically started**. It's an optional component.

**To Start the Backend:**

1. Open a new terminal window
2. Navigate to backend directory:
   ```bash
   cd expo-mnemo-backend
   ```
3. Install dependencies (first time only):
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

**Backend URL:** `http://localhost:3000`

**Current Configuration:** The Expo app is using the **local stub classifier** by default (not the API). The backend is optional and only needed if you want to use remote emotion classification.

**To Use the Backend:**
- Update `services/EmotionClassifier.ts` to configure the API URL
- Or use the `configureEmotionClassifier()` function (see `services/API_CONFIG.md`)

---

## 2. Audio Recording Storage

### Where Are Audio Recordings Saved?

**Location:** Audio recordings are saved to a **temporary directory** managed by Expo AV.

**Details:**
- **Path:** Managed by `expo-av` library (typically in app's temporary directory)
- **URI:** Stored in memory entry's `details.audioUri` field
- **Format:** The URI is a temporary file path (e.g., `file:///path/to/temp/recording.m4a`)
- **Persistence:** Audio files are **temporary** and may be cleaned up by the system

**Current Behavior:**
- Audio is recorded during capture sessions
- URI is stored in memory entry details
- Audio file itself is temporary (not permanently saved)
- If you want to keep audio, you'd need to copy it to a permanent location

**To Keep Audio Files:**
Currently, the app doesn't permanently save audio files. The `audioUri` in memory details points to a temporary file. To keep audio:
1. Copy the file to a permanent directory (e.g., Documents directory)
2. Update the URI in the memory entry
3. Or implement a setting to keep raw audio (similar to iOS version)

**Note:** The app respects the `autoDeleteRawAudio` setting (if implemented), but currently audio is temporary by default.

---

## 3. Permission Prompts - App Name Display

### Is It Normal for the Project Name to Show?

**Yes, this is completely normal iOS/Android behavior!**

**What You're Seeing:**
- Permission prompts show: **"Mnemo"** (your app name)
- This is the `name` field from `app.json`: `"name": "Mnemo"`

**Why This Happens:**
- iOS and Android show the app's display name in permission prompts
- This is standard behavior - users need to know which app is requesting permission
- The name comes from your `app.json` configuration

**Is It Suspicious?**
- **No!** This is exactly how all apps work
- Users expect to see the app name in permission prompts
- It's actually **more trustworthy** than seeing a generic name

**Examples:**
- Instagram shows "Instagram" in permission prompts
- Camera apps show their app name
- This is the standard iOS/Android UX pattern

**Your Current Configuration:**
```json
{
  "expo": {
    "name": "Mnemo",  // ← This is what shows in permission prompts
    "slug": "mnemo-expo",
    ...
  }
}
```

**To Change the Display Name:**
If you want a different name to show in permission prompts:
1. Update `app.json` → `expo.name`
2. Rebuild the app (Expo Go uses the name from the project)

**Permission Messages:**
Your permission descriptions are already user-friendly:
- Location: "Mnemo needs location access to log where you were..."
- Microphone: "Mnemo needs microphone access only during Emotional Capture Sessions..."
- Photos: "Mnemo needs photo library access to import photos you select..."

These are clear and explain why permissions are needed.

---

## Summary

✅ **Backend:** Optional, not running by default. Start manually if needed.
✅ **Audio Storage:** Temporary files, URI stored in memory entries
✅ **Permission Prompts:** Showing "Mnemo" is normal and expected iOS/Android behavior

Everything is working as designed! 🎉

