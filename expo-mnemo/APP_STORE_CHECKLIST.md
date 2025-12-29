# App Store Deployment Checklist

## Legal Documents Required

### ✅ Privacy Policy
- **Location**: `expo-mnemo/legal/PRIVACY_POLICY.md`
- **In App**: Yes - Accessible via Settings → Legal → Privacy Policy
- **For Store Submission**: 
  - **Google Play**: Required - Provide URL or host on website
  - **Apple App Store**: Required - Provide URL or host on website
- **Status**: ✅ Complete

### ✅ Terms of Service
- **Location**: `expo-mnemo/legal/TERMS_OF_SERVICE.md`
- **In App**: Yes - Accessible via Settings → Legal → Terms of Service
- **For Store Submission**: 
  - **Google Play**: Recommended but not required
  - **Apple App Store**: Recommended but not required
- **Status**: ✅ Complete

## Store Submission Requirements

### Google Play Store

#### Required Information:
1. **Privacy Policy URL** ✅
   - Host the privacy policy on a website OR
   - Use the in-app version (provide app store listing link)
   - Must be publicly accessible

2. **App Content Rating** ⚠️
   - Complete content rating questionnaire
   - Likely rating: "Everyone" or "Teen" (due to AI processing)

3. **Data Safety Section** ⚠️
   - Declare data collection:
     - Photos ✅
     - Audio ✅
     - Location ✅
     - Device ID (if collected)
   - Declare data sharing:
     - Google Gemini API ✅
   - Declare data security:
     - Data encrypted in transit ✅
     - Data encrypted at rest ✅

4. **Permissions Declaration** ✅
   - Camera: Required for photo capture
   - Microphone: Required for audio recording
   - Location: Optional - for location tagging
   - Photo Library: Required for photo import

5. **Target Audience** ✅
   - Age: 13+ (COPPA compliance)
   - Not intended for children under 13

### Apple App Store

#### Required Information:
1. **Privacy Policy URL** ✅
   - Must be hosted on a website
   - Cannot be in-app only for submission
   - Must be publicly accessible

2. **Privacy Nutrition Labels** ⚠️
   - Declare data collection:
     - Photos ✅
     - Audio ✅
     - Location ✅
   - Declare data usage:
     - App Functionality ✅
     - Analytics (if any)
   - Declare data linked to user:
     - No (data stored locally) ✅
   - Declare data used for tracking:
     - No ✅

3. **Age Rating** ⚠️
   - Complete age rating questionnaire
   - Likely rating: 4+ or 12+ (due to AI processing)

4. **App Review Information** ⚠️
   - Provide test account (if needed)
   - Provide demo video
   - Explain AI features

## Next Steps

### Before Submission:

1. **Host Privacy Policy Online** ⚠️
   - Upload `PRIVACY_POLICY.md` to your website
   - Get a public URL (e.g., `https://yourdomain.com/privacy-policy`)
   - Update contact information in the policy

2. **Update Contact Information** ⚠️
   - Replace `[Your Contact Email]` in both documents
   - Replace `[Your Website URL]` in both documents
   - Replace `[Your Jurisdiction]` in Terms of Service

3. **Complete Store Questionnaires** ⚠️
   - Google Play: Data Safety section
   - Apple App Store: Privacy Nutrition Labels
   - Both: Content rating questionnaires

4. **Prepare App Store Assets** ⚠️
   - App icon (1024x1024)
   - Screenshots (various sizes)
   - Feature graphic (Google Play)
   - App preview video (optional but recommended)

5. **Test on Physical Devices** ⚠️
   - Test with actual photos
   - Test with audio recordings
   - Test location features
   - Verify all permissions work correctly

## Legal Compliance

### GDPR (EU Users)
- ✅ Privacy Policy includes GDPR compliance
- ✅ User rights explained
- ✅ Data deletion options provided
- ✅ Data minimization practices

### CCPA (California Users)
- ✅ Privacy Policy includes CCPA compliance
- ✅ User rights explained
- ✅ No selling of data

### COPPA (Children)
- ✅ App not intended for children under 13
- ✅ Privacy Policy states this clearly

## Important Notes

1. **Privacy Policy MUST be hosted online** for Apple App Store submission
2. **In-app legal screen is optional** but recommended for user access
3. **Update contact information** before submission
4. **Review both documents** to ensure they match your actual data practices
5. **Test thoroughly** before submission

## Files Created

- ✅ `expo-mnemo/legal/PRIVACY_POLICY.md` - Privacy Policy document
- ✅ `expo-mnemo/legal/TERMS_OF_SERVICE.md` - Terms of Service document
- ✅ `expo-mnemo/screens/LegalScreen.tsx` - In-app legal screen
- ✅ `expo-mnemo/navigation/SettingsStackNavigator.tsx` - Navigation for legal screen

## Status

- ✅ Legal documents created
- ✅ In-app legal screen implemented
- ⚠️ Need to host privacy policy online
- ⚠️ Need to update contact information
- ⚠️ Need to complete store questionnaires

