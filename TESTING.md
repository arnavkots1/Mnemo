# Mnemo Testing Guide

Step-by-step guide for testing Mnemo on iOS Simulator and real iPhone devices.

## Prerequisites

- Xcode installed (latest version recommended)
- iOS Simulator (comes with Xcode)
- iPhone with USB cable (for device testing)
- Apple ID (free developer account is sufficient)

## Part 1: Running on iOS Simulator

### A. Open Project in Xcode

1. **Navigate to project folder**:
   - Open Finder
   - Go to your Mnemo project directory
   - Look for `Mnemo.xcodeproj` file

2. **Open in Xcode**:
   - Double-click `Mnemo.xcodeproj` OR
   - Right-click → "Open With" → Xcode
   - Xcode should launch and show your project

3. **Verify project structure**:
   - Left sidebar should show:
     - Blue project icon (Mnemo)
     - Targets (Mnemo)
     - Groups: App, Models, Services, Stores, Views
   - Swift files should be visible in the file navigator

### B. Configure Signing (Required Before First Run)

1. **Select project**:
   - Click the blue project icon in left sidebar
   - Select the "Mnemo" target (under TARGETS)

2. **Set up signing**:
   - Click "Signing & Capabilities" tab
   - Under "Team", select your Apple ID
   - If you don't see your Apple ID:
     - Click "Add Account..."
     - Sign in with your Apple ID
     - Select it from the dropdown
   - Ensure "Automatically manage signing" is checked
   - Bundle Identifier should be unique (e.g., `com.yourname.mnemo`)

3. **Verify no errors**:
   - Should see green checkmark: "Signing certificate: Apple Development"
   - No red error messages

### C. Select Simulator and Run

1. **Choose simulator**:
   - At the top toolbar, find device selector (next to scheme)
   - Click dropdown (shows "Mnemo > iPhone 16 Pro" or similar)
   - Select an iPhone simulator (e.g., iPhone 15 Pro, iPhone 16 Pro)
   - Choose iOS version (latest is recommended)

2. **Build and run**:
   - Click the Play button (▶) in top-left OR
   - Press `Cmd + R`
   - Xcode will build the project (first time may take a minute)

3. **First launch**:
   - Simulator should launch automatically
   - App should appear in simulator
   - You should see the tab bar with: Today, Moments, Settings

### D. Grant Permissions in Simulator

When you use features that need permissions:

**Location**:
- First time: Tap "Allow While Using App" or "Allow Once"
- To test location: Xcode → Debug menu → Location → Choose:
  - "Apple" (Cupertino)
  - "Freeway Drive" (simulated driving)
  - "Custom Location..." (set custom coordinates)

**Microphone & Speech Recognition**:
- First time: Tap "Allow" when prompted
- Simulator uses your Mac's microphone
- Speak into your Mac's mic during Emotional Capture sessions

**Calendar**:
- First time: Tap "Allow" when prompted
- Simulator has a fake calendar you can add events to

**Motion**:
- ⚠️ Motion activity doesn't work well in simulator
- You'll need a real device to test motion detection

**Photos**:
- Simulator can access your Mac's Photos (if enabled)
- Or use simulator's photo library

### E. Basic Navigation Test

1. **Today Tab**:
   - Should show "Start Emotional Capture" button
   - Timeline should be empty initially
   - After location permissions, context memories may appear

2. **Moments Tab**:
   - Should show "Import from Photos" button
   - Empty state if no moments yet

3. **Settings Tab**:
   - Should show all toggles and sections
   - Toggles should be functional

## Part 2: Running on Real iPhone

### A. Connect iPhone

1. **Connect device**:
   - Plug iPhone into Mac with USB cable
   - Unlock iPhone
   - If prompted: Tap "Trust This Computer" on iPhone
   - Enter iPhone passcode if asked

2. **Enable Developer Mode** (iOS 16+):
   - On iPhone: Settings → Privacy & Security → Developer Mode
   - Toggle ON
   - iPhone will restart
   - After restart, confirm Developer Mode is enabled

### B. Configure Signing for Device

1. **In Xcode**:
   - Project icon → Target "Mnemo" → Signing & Capabilities
   - Select your Apple ID team
   - Ensure Bundle Identifier is unique
   - "Automatically manage signing" should be checked

2. **Verify**:
   - Should see: "Signing certificate: Apple Development"
   - Your iPhone should appear under "Provisioning Profile"

### C. Select iPhone and Run

1. **Choose device**:
   - Top toolbar device selector
   - Your iPhone should appear (e.g., "Arnav's iPhone")
   - Select it

2. **Build and run**:
   - Click Play (▶) or `Cmd + R`
   - First time may show "Waiting for device..."
   - iPhone may show "Untrusted Developer" dialog

3. **Trust developer profile**:
   - On iPhone: Settings → General → VPN & Device Management
   - Tap your developer profile (e.g., "Apple Development: your@email.com")
   - Tap "Trust [your profile]"
   - Confirm "Trust"

4. **App should install**:
   - App icon appears on iPhone home screen
   - App launches automatically
   - You should see Mnemo's tab bar

### D. Grant Permissions on Device

**Location**:
- First time: Choose "Allow While Using App" or "Allow Always"
- To test: Walk around or use Xcode → Debug → Location → Custom Location

**Microphone & Speech**:
- First time: Tap "Allow" for both prompts
- Use iPhone's microphone (not Mac's)

**Motion**:
- First time: Tap "Allow"
- Now motion detection will actually work!

**Calendar**:
- First time: Tap "Allow"
- Uses your iPhone's calendar

**Photos**:
- First time: Tap "Allow" (if prompted)
- Uses iPhone's photo library

## Part 3: Manual Testing Checklist

### 1. Passive Context Logging

**Setup**:
- Settings → Enable "Passive Context Logging"
- Grant location permission (Always)
- Grant motion permission

**Test**:
1. Walk around for 5-10 minutes
2. Or use Xcode → Debug → Location → "Freeway Drive"
3. Check Today tab
4. Should see context memories appearing:
   - "Visit at [Place Name] (walking), [time range]"
   - Activity type badges
   - Location names

**Verify**:
- Memories appear in reverse chronological order
- Place names are populated
- Activity types are correct (walking, stationary, etc.)
- Calendar events appear if enabled and events exist

### 2. Emotional Capture Session

**Setup**:
- Settings → Enable "Allow Speech Recognition"
- Grant microphone permission
- Grant speech recognition permission

**Test**:
1. Go to Today tab
2. Tap "Start Emotional Capture"
3. Full-screen session view appears
4. Mic icon should be pulsing
5. Timer should be counting up
6. **Speak clearly and emotionally**:
   - Laugh loudly
   - Say: "I'm SO happy! This is amazing!"
   - Keep talking for 10-20 seconds
7. Watch for toast notification: "Happy moment: you said..."
8. Tap "End Session"
9. Go to Moments tab
10. Should see new emotional moment entry

**Verify**:
- Toast appears when moment is detected
- Moment appears in Moments tab
- Summary includes emotion and transcript
- Confidence value is stored
- If nothing triggers: Lower threshold in `EmotionModelConfig` (see Troubleshooting)

**Check Emotion Model Status**:
- Settings tab should show "Emotion model: ✅ Loaded" or "❌ Not loaded"
- If not loaded: Ensure `EmotionAudioClassifier.mlmodel` is in Xcode project

### 3. Photo Moments

**Setup**:
- Grant photo library permission (if prompted)

**Test**:
1. Go to Moments tab
2. Tap "Import from Photos"
3. Photo picker appears
4. Select 2-3 photos
5. Photos should process
6. Return to Moments tab
7. Should see photo moments with thumbnails

**Verify**:
- Thumbnails load correctly
- Photos show correct dates/times
- Location metadata appears if available
- Photos appear in reverse chronological order

### 4. Settings Toggles

**Test Each Toggle**:

1. **Passive Context Logging**:
   - Turn OFF → Location services should stop
   - Turn ON → Location services should restart
   - Check Today tab for new/stopped memories

2. **Use Motion Activity**:
   - Turn OFF → Activity type should become "unknown"
   - Turn ON → Activity types should appear again

3. **Use Calendar Events**:
   - Turn ON → Calendar events should enrich summaries
   - Turn OFF → No calendar enrichment

4. **Auto-delete Raw Audio**:
   - Toggle and verify behavior (may need to check file system)

5. **Allow Speech Recognition**:
   - Turn OFF → Emotional moments should have no transcript
   - Turn ON → Transcripts should appear

**Verify**:
- Changes take effect immediately
- No app restart required
- Services start/stop correctly

### 5. Delete All Data

**Test**:
1. Create some memories (context, emotional, photo)
2. Go to Settings
3. Tap "Delete All Data"
4. Confirm deletion
5. Check Today and Moments tabs
6. Should be empty

**Verify**:
- All memories deleted
- App doesn't crash
- Can create new memories after deletion

## Part 4: Troubleshooting

### App Won't Build

**Error: "No such module 'CoreML'"**:
- Ensure deployment target is iOS 14.0+ (Core ML requires iOS 11+, but we use iOS 14+ features)
- Check: Project → Target → General → Deployment Target

**Error: Signing issues**:
- Ensure Bundle Identifier is unique
- Check Team is selected
- Try cleaning build folder: Product → Clean Build Folder (`Cmd + Shift + K`)

**Error: Missing files**:
- Ensure all Swift files are added to target
- Select file → File Inspector → Target Membership → Check "Mnemo"

### Permissions Not Requesting

- Check Info.plist has all required keys
- Ensure keys match exactly (case-sensitive)
- Try deleting app and reinstalling

### Emotion Model Not Loading

**Check**:
1. Settings tab shows "Emotion model: ❌ Not loaded"
2. Verify `EmotionAudioClassifier.mlmodel` is in Xcode project
3. Check Target Membership includes "Mnemo"
4. Check console for error messages

**Fix**:
- Add model file to project
- Ensure it's in the app bundle (not a framework)
- Rebuild app

### No Emotional Events Detected

**Possible causes**:
- Model threshold too high
- Not enough consecutive detections
- Audio quality too low
- Model not trained on similar audio

**Quick fix for testing**:
- Lower `EmotionModelConfig.detectionThreshold` to 0.4
- Set `consecutiveDetectionsRequired` to 1
- Rebuild and test

### Location Not Working

**Simulator**:
- Use Xcode → Debug → Location → Choose a location
- "None" disables location

**Device**:
- Check Settings → Privacy → Location Services → Mnemo
- Ensure "Always" is selected (for visit monitoring)
- Walk around or drive to trigger visits

### Motion Not Working

**Simulator**:
- Motion doesn't work in simulator
- Use real device for motion testing

**Device**:
- Check Settings → Privacy → Motion & Fitness → Mnemo
- Ensure it's enabled
- Walk around to trigger motion detection

## Part 5: Quick Test Script

Run through this quick checklist each time you make changes:

```
□ App builds without errors
□ App launches on simulator/device
□ All permissions granted
□ Today tab shows "Start Emotional Capture" button
□ Settings tab shows all toggles
□ Toggle "Passive Context Logging" ON → memories appear
□ Start Emotional Capture → speak → moment detected
□ Import photo → appears in Moments
□ Delete All Data → memories cleared
□ Emotion model status shows in Settings
```

## Part 6: Performance Testing

### Battery Impact

**Monitor**:
- Settings → Battery → Check Mnemo usage
- Run app for 1 hour with all features enabled
- Check battery drain percentage

**Expected**:
- Minimal drain with passive logging
- Higher drain during Emotional Capture sessions (expected)

### CPU Usage

**Monitor in Xcode**:
- Run app
- Xcode → Debug → View Debugging → CPU
- Check CPU usage during:
  - Passive logging (should be low)
  - Emotional Capture (may spike during classification)

**Expected**:
- Background: <5% CPU
- Emotional Capture: <20% CPU during classification

## Part 7: Device-Specific Notes

### iPhone Requirements

- iOS 16.0+ (for PhotosPicker and modern SwiftUI)
- iPhone with motion coprocessor (all modern iPhones)
- Microphone (all iPhones)

### Simulator Limitations

- Motion activity: Doesn't work
- Real location visits: Limited (use custom locations)
- Audio quality: Uses Mac mic (may differ from device)
- Performance: May be slower than real device

### Real Device Advantages

- Actual motion detection
- Real location visits
- Better audio quality
- Accurate performance metrics
- Core ML runs faster on device

## Next Steps

After basic testing works:
1. Test with your own data
2. Adjust thresholds based on your voice/audio
3. Fine-tune emotion model if needed
4. Test edge cases (low battery, background, etc.)

