# Expected Warnings in Expo Go

When running Mnemo in Expo Go, you may see some warnings. **These are normal and expected** - they don't indicate errors with your app.

## Background Location Warnings

### Warning: "Background permissions not available (likely Expo Go limitation)"

**What it means:** Expo Go doesn't support background location tracking on iOS/Android. This is a limitation of Expo Go, not your app.

**What happens:** The app automatically falls back to foreground-only location polling, which works perfectly fine. When the app is open, it will track your location every 5 minutes.

**Is this a problem?** No! The app works correctly - it just uses foreground polling instead of background tracking.

**To get background tracking:** You would need to create a development build (not Expo Go). See: https://expo.fyi/dev-client

### Warning: "Background location has not been configured"

**What it means:** Same as above - background location isn't available in Expo Go.

**What happens:** The app gracefully handles this and continues with foreground polling.

**Is this a problem?** No! This is expected behavior in Expo Go.

## Expo AV Deprecation Warning

### Warning: "[expo-av]: Expo AV has been deprecated"

**What it means:** Expo AV is being replaced with `expo-audio` and `expo-video` in future SDK versions.

**What happens:** Nothing - your app continues to work normally.

**Is this a problem?** No! This is just a deprecation notice. The app will continue working. You can migrate to `expo-audio` later if needed.

## Summary

All these warnings are **expected and harmless** when running in Expo Go. Your app will work correctly:

- ✅ Location tracking works (foreground-only in Expo Go)
- ✅ Audio recording works
- ✅ Photo import works
- ✅ Memory storage works
- ✅ All features function normally

The warnings are just informational - they're telling you that some advanced features (like background location) aren't available in Expo Go, but the app gracefully handles this and continues working.

