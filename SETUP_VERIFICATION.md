# Setup Verification Checklist

Use this checklist to verify your Xcode project is correctly configured.

## ✅ Pre-Build Checklist

### Project Structure
- [ ] All Swift files added to Xcode project
- [ ] Files organized in groups: App, Models, Services, Stores, Views
- [ ] Info.plist added and configured
- [ ] No missing file references (red files in navigator)

### Project Settings
- [ ] Deployment Target: iOS 16.0+
- [ ] Bundle Identifier: Unique (e.g., `com.yourname.mnemo`)
- [ ] Signing: Team selected, "Automatically manage signing" checked
- [ ] No signing errors (green checkmark)

### Info.plist Permissions
- [ ] `NSLocationWhenInUseUsageDescription` ✓
- [ ] `NSLocationAlwaysAndWhenInUseUsageDescription` ✓
- [ ] `NSLocationAlwaysUsageDescription` ✓
- [ ] `NSMicrophoneUsageDescription` ✓
- [ ] `NSSpeechRecognitionUsageDescription` ✓
- [ ] `NSMotionUsageDescription` ✓
- [ ] `NSCalendarsUsageDescription` ✓
- [ ] `NSPhotoLibraryUsageDescription` ✓
- [ ] `UIBackgroundModes` with `location` ✓

### Core ML Model (Optional)
- [ ] `EmotionAudioClassifier.mlmodel` added to project
- [ ] Model has Target Membership: Mnemo ✓
- [ ] Xcode generated Swift class (check in DerivedData if needed)

## ✅ Build Checklist

### Compilation
- [ ] Project builds without errors (`Cmd + B`)
- [ ] No missing imports
- [ ] All protocols conform correctly
- [ ] No type mismatches

### Warnings (Can Ignore)
- [ ] Some warnings are OK (e.g., unused variables)
- [ ] Fix critical warnings only

## ✅ Runtime Checklist

### App Launch
- [ ] App launches on simulator
- [ ] Tab bar appears (Today, Moments, Settings)
- [ ] No crashes on launch
- [ ] Console shows no critical errors

### Permissions
- [ ] Location permission requested
- [ ] Microphone permission requested (when starting Emotional Capture)
- [ ] Speech recognition permission requested
- [ ] Motion permission requested
- [ ] Calendar permission requested (if enabled)

### Features
- [ ] Today tab shows "Start Emotional Capture" button
- [ ] Moments tab shows "Import from Photos" button
- [ ] Settings tab shows all sections
- [ ] Settings shows "Emotion Model: ✅ Loaded" or "❌ Not loaded"

## ✅ Core ML Integration Verification

### Model Loading
- [ ] Check console for: `✓ Core ML model loaded successfully`
- [ ] OR: `⚠️ Core ML model not found. Using fallback random detection.`
- [ ] Settings shows correct model status

### Model Inference (If Model Loaded)
- [ ] Start Emotional Capture session
- [ ] Speak into mic
- [ ] Check console for classification results
- [ ] Events trigger when threshold met

### Fallback Behavior (If Model Not Loaded)
- [ ] App still works
- [ ] Random emotion detection works
- [ ] No crashes

## Common Issues & Fixes

### Issue: "No such module 'CoreML'"
**Fix**: 
- Check deployment target is iOS 14.0+
- Clean build folder: `Cmd + Shift + K`
- Rebuild

### Issue: Model not loading
**Fix**:
- Verify model file is in project
- Check Target Membership
- Ensure file is in app bundle (not framework)
- Check console for specific error

### Issue: Signing errors
**Fix**:
- Ensure Bundle Identifier is unique
- Select correct Team
- Try cleaning build folder
- Delete derived data: `~/Library/Developer/Xcode/DerivedData`

### Issue: Permissions not requesting
**Fix**:
- Verify Info.plist keys match exactly
- Delete app and reinstall
- Check keys are in correct format

## Quick Verification Commands

### Check if model exists in bundle:
```swift
// In Xcode console or debugger:
let url = Bundle.main.url(forResource: "EmotionAudioClassifier", withExtension: "mlmodel")
print(url != nil ? "Model found" : "Model not found")
```

### Check all files compile:
- Product → Build (`Cmd + B`)
- Should complete without errors

### Check target membership:
- Select any Swift file
- File Inspector (right sidebar)
- Target Membership → "Mnemo" should be checked

## Next Steps After Verification

1. ✅ All checks pass → Ready to test!
2. Follow `TESTING.md` for detailed testing
3. Add emotion model if not already added
4. Test on real device for best results

