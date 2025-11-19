# Quick Start Guide - Running Mnemo in Xcode

**TL;DR**: Open project → Configure signing → Build & Run → Test features

## Step 1: Create Xcode Project (5 minutes)

### Option A: Create New Project and Add Files

1. **Open Xcode** → File → New → Project
2. **Choose**: iOS → App → Next
3. **Configure**:
   - Product Name: `Mnemo`
   - Team: Your Apple ID
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Click "Next" → "Create"

4. **Delete default files**:
   - Delete `ContentView.swift` (if created)
   - Delete default `MnemoApp.swift` if it exists

5. **Add your Swift files**:
   - Right-click project folder → "Add Files to Mnemo..."
   - Navigate to `Mnemo/` folder
   - Select: App, Models, Services, Stores, Views folders
   - ✅ Check "Create groups"
   - ✅ Check "Add to targets: Mnemo"
   - Click "Add"

6. **Add Info.plist**:
   - Drag `Mnemo/Info.plist` into Xcode
   - ✅ Check "Copy items if needed"
   - ✅ Check "Add to targets: Mnemo"

### Option B: Open Existing Project (If you have .xcodeproj)

1. **Double-click** `Mnemo.xcodeproj` in Finder
2. Xcode opens automatically
3. Verify all files are present in navigator

## Step 2: Configure Project (2 minutes)

### A. Set Deployment Target

1. Click **blue project icon** (left sidebar)
2. Select **Target "Mnemo"**
3. **General** tab → **iOS Deployment Target**: `16.0`

### B. Configure Signing

1. **Signing & Capabilities** tab
2. **Team**: Select your Apple ID
3. **Bundle Identifier**: Change to `com.yourname.mnemo` (make it unique!)
4. ✅ Check **"Automatically manage signing"**
5. Should see: ✅ "Signing certificate: Apple Development"

### C. Add Background Modes

1. **Signing & Capabilities** tab
2. Click **"+ Capability"**
3. Add **Background Modes**
4. Check **"Location updates"** only
5. **DO NOT** add Audio background mode (we're foreground-only)

## Step 3: Build & Run on Simulator (1 minute)

1. **Select Simulator**:
   - Top toolbar → Device dropdown
   - Choose: **iPhone 15 Pro** or **iPhone 16 Pro**

2. **Build & Run**:
   - Click **Play** button (▶) OR `Cmd + R`
   - Wait for build to complete
   - Simulator launches automatically

3. **First Launch**:
   - App should appear in simulator
   - Tab bar visible: Today, Moments, Settings
   - Grant permissions when prompted

## Step 4: Test Basic Features (5 minutes)

### Test Navigation
- [ ] Tap each tab (Today, Moments, Settings)
- [ ] All tabs load without crashes

### Test Settings
- [ ] Settings tab shows all sections
- [ ] "Emotion Model" shows status (✅ or ❌)
- [ ] Toggles are functional

### Test Emotional Capture (Without Model)
- [ ] Today tab → Tap "Start Emotional Capture"
- [ ] Full-screen session view appears
- [ ] Mic icon pulses
- [ ] Timer counts up
- [ ] Speak into Mac mic for 10 seconds
- [ ] Tap "End Session"
- [ ] Check Moments tab (may see random detection if no model)

## Step 5: Add Core ML Model (Optional - 2 minutes)

### If You Have a Trained Model

1. **Get model file**:
   - Train using `emotion_model/train.py`
   - Output: `EmotionAudioClassifier.mlmodel`

2. **Add to Xcode**:
   - Drag `EmotionAudioClassifier.mlmodel` into Xcode project
   - ✅ Check "Copy items if needed"
   - ✅ Check "Add to targets: Mnemo"
   - Click "Add"

3. **Verify**:
   - Model appears in project navigator
   - Build project (`Cmd + B`)
   - Check console: Should see `✓ Core ML model loaded successfully`
   - Settings → Should show "Emotion Model: ✅ Loaded"

### If You Don't Have a Model Yet

- App will work with fallback random detection
- You can test UI and flow
- Add model later when ready

## Step 6: Run on Real iPhone (5 minutes)

### A. Connect iPhone

1. **Plug iPhone** into Mac with USB cable
2. **Unlock iPhone**
3. **Tap "Trust This Computer"** if prompted

### B. Enable Developer Mode (iOS 16+)

1. On iPhone: **Settings → Privacy & Security → Developer Mode**
2. **Toggle ON**
3. iPhone restarts
4. After restart, confirm Developer Mode is enabled

### C. Select Device and Run

1. **In Xcode**: Top toolbar → Device selector
2. **Select your iPhone** (e.g., "Arnav's iPhone")
3. **Click Play** (▶) or `Cmd + R`
4. **First time**: iPhone may show "Untrusted Developer"

### D. Trust Developer Profile

1. On iPhone: **Settings → General → VPN & Device Management**
2. Tap your developer profile
3. Tap **"Trust [your profile]"**
4. Confirm "Trust"
5. App should install and launch

### E. Grant Permissions

- **Location**: Choose "Allow Always" (for visit monitoring)
- **Microphone**: Tap "Allow"
- **Speech Recognition**: Tap "Allow"
- **Motion**: Tap "Allow"
- **Calendar**: Tap "Allow" (optional)

## Step 7: Verify Everything Works

### Quick Test Checklist

```
□ App builds without errors
□ App launches on simulator/device
□ Tab bar appears (Today, Moments, Settings)
□ Today tab shows "Start Emotional Capture" button
□ Settings tab shows all toggles
□ Emotion Model status shows (✅ or ❌)
□ Permissions can be granted
□ No crashes
```

### Test Passive Context Logging

1. **Settings** → Enable "Passive Context Logging"
2. **Grant location permission** (Always)
3. **Walk around** or use Xcode → Debug → Location → "Freeway Drive"
4. **Check Today tab** → Should see context memories appearing

### Test Emotional Capture

1. **Today** → Tap "Start Emotional Capture"
2. **Speak clearly and emotionally**:
   - Laugh loudly
   - Say: "I'm SO happy! This is amazing!"
   - Keep talking for 10-20 seconds
3. **Watch for toast**: "Happy moment: you said..."
4. **Check Moments tab** → Should see emotional moment entry

**If nothing triggers**:
- Lower threshold: `EmotionModelConfig.detectionThreshold = 0.3`
- Reduce consecutive detections: `consecutiveDetectionsRequired = 1`
- Rebuild and test again

### Test Photo Moments

1. **Moments** → Tap "Import from Photos"
2. **Select 2-3 photos**
3. **Check Moments tab** → Should see photo moments with thumbnails

## Troubleshooting

### Build Errors

**"No such module 'CoreML'"**:
- Deployment target must be iOS 14.0+
- Clean: Product → Clean Build Folder (`Cmd + Shift + K`)

**Signing errors**:
- Bundle Identifier must be unique
- Select correct Team
- Clean build folder

**Missing files**:
- Verify all Swift files added to target
- File Inspector → Target Membership → Check "Mnemo"

### Runtime Issues

**App crashes**:
- Check console for error messages
- Verify Info.plist is configured
- Check all frameworks are linked

**Model not loading**:
- Verify model file is in project
- Check Target Membership
- Check console for specific error

**No emotional events**:
- Lower `EmotionModelConfig.detectionThreshold` to 0.3
- Set `consecutiveDetectionsRequired` to 1
- Speak louder and more clearly
- Check model is actually loaded (Settings tab)

## What's Next?

1. ✅ **Setup complete** → Follow `TESTING.md` for detailed testing
2. **Train emotion model** → See `emotion_model/README.md`
3. **Adjust thresholds** → Modify `EmotionModelConfig` values
4. **Test on device** → Real device gives best results

## Files You Need

- ✅ All Swift files (already in `Mnemo/` folder)
- ✅ `Info.plist` (already configured)
- ⚠️ `EmotionAudioClassifier.mlmodel` (optional, add when ready)

## Quick Reference

**Build**: `Cmd + B`
**Run**: `Cmd + R`
**Clean**: `Cmd + Shift + K`
**Stop**: `Cmd + .`

**Simulator Location**: Debug → Location → Choose location
**View Console**: View → Debug Area → Activate Console (`Cmd + Shift + C`)

