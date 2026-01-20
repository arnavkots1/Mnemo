# 🚀 Mnemo Setup Instructions

## 🎉 What's New?

Your app now has **Firebase authentication and cloud storage**! This means:
- ✅ **User accounts** - Sign up / Sign in
- ✅ **Cloud backup** - Your data is safe even if you uninstall the app
- ✅ **Multi-device sync** - Access your memories from any device
- ✅ **Never lose data** - Everything is backed up to the cloud

---

## 📋 What YOU Need to Do (15 minutes total)

### Step 1: Install Dependencies (2 minutes)

```bash
cd expo-mnemo
npm install
```

This will install the new Firebase packages.

---

### Step 2: Set Up Firebase (10 minutes)

**Follow the detailed instructions in `FIREBASE_SETUP.md`** which covers:

1. Creating a Firebase project (5 min)
2. Adding a web app (3 min)
3. Enabling authentication (2 min)
4. Creating Firestore database (2 min)
5. Enabling Storage (1 min)
6. Adding config to `.env` file

**Quick link:** Open `expo-mnemo/FIREBASE_SETUP.md` for step-by-step instructions.

---

### Step 3: Add Firebase Config to `.env` (3 minutes)

Once you complete Firebase setup, you'll get a config object. Add it to your `.env` file:

**File:** `expo-mnemo/.env`

```env
# Existing
EXPO_PUBLIC_API_URL=http://172.16.140.220:3000

# Add these (paste your values from Firebase Console)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

---

### Step 4: Restart the App

```bash
# Stop the current Expo server (Ctrl+C)
# Then restart it
npx expo start
```

---

## ✨ What Changed in the App?

### 1. **Authentication Screen**
- Beautiful login/signup screen (gradient purple background)
- Email + password authentication
- Password reset functionality
- Account creation with email verification

### 2. **Cloud Storage**
- **Moments** → Saved to Firestore + AsyncStorage (local cache)
- **Memories** → Saved to Firestore + AsyncStorage (local cache)
- **Photos & Audio** → Can be uploaded to Firebase Storage (future)

### 3. **Settings Screen**
- New **Account section** showing your name and email
- **Sign Out button** to log out

### 4. **Data Migration**
- Your existing local data will be automatically uploaded to Firestore when you sign in
- Nothing is deleted - local data stays as backup

---

## 🔐 How Authentication Works

### First Time Users:
1. App opens → Shows **login/signup screen**
2. **Sign Up** → Create account with email/password
3. Email verification sent (optional to complete)
4. **Logged in** → Access full app

### Returning Users:
1. App opens → Checks if you're logged in
2. If yes → Goes straight to app
3. If no → Shows login screen

### Signing Out:
1. Go to **Settings** → Scroll to **Account** section
2. Tap **Sign Out**
3. You'll see the login screen again

---

## 💾 How Data Sync Works

### When You're Online:
- **Save moment** → Saves to Firestore ☁️ + AsyncStorage 📱
- **Load moments** → Loads from Firestore ☁️ first
- **Delete moment** → Deletes from Firestore ☁️ + AsyncStorage 📱

### When You're Offline:
- **Save moment** → Saves to AsyncStorage 📱 only
- **Load moments** → Loads from AsyncStorage 📱
- Next time online → Manual sync (or auto-sync in future update)

---

## 🆘 Troubleshooting

### "Firebase not configured" Warning
- **Fix:** Complete Step 2 & 3 above (Firebase setup + .env config)
- App will still work locally without Firebase

### "REQUEST_DENIED" Error
- **Fix:** Make sure you enabled **Places API** and **Geocoding API** in Google Cloud Console
- See `GOOGLE_PLACES_SETUP.md` for instructions

### Can't Sign In / Sign Up
- **Check:** Firebase Authentication is enabled in Firebase Console
- **Check:** `.env` file has correct Firebase config
- **Check:** Restart Expo server after adding .env values

### Photos Not Uploading
- **Current:** Photos are saved locally only
- **Future:** Will add Firebase Storage upload

---

## 📊 Firebase Free Tier Limits

You're on the **Spark (Free) Plan** which includes:

### Firestore (Database):
- ✅ **50K reads/day** (plenty for personal use)
- ✅ **20K writes/day**
- ✅ **1 GB storage**

### Storage (Photos/Audio):
- ✅ **5 GB storage**
- ✅ **1 GB downloads/day**

### Authentication:
- ✅ **Unlimited** users

**You'll be fine for personal use!** 🎉

---

## 🎯 What's Next?

### Immediate:
1. Complete Firebase setup
2. Test sign up / sign in
3. Create some moments and verify they sync

### Future Enhancements:
- Upload photos to Firebase Storage (not local only)
- Offline queue for pending uploads
- Auto-sync when back online
- Google Sign-In (one-tap login)
- Multi-device real-time sync

---

## 📚 Related Docs

- `FIREBASE_SETUP.md` - Detailed Firebase setup instructions
- `GOOGLE_PLACES_SETUP.md` - Google Places API setup
- `LOCATION_TRACKING_RULES.md` - How location tracking works

---

## ✅ Quick Checklist

- [ ] Run `npm install` in `expo-mnemo/`
- [ ] Create Firebase project
- [ ] Enable Authentication (Email/Password)
- [ ] Create Firestore database
- [ ] Enable Storage
- [ ] Add Firebase config to `.env`
- [ ] Restart Expo server
- [ ] Test sign up
- [ ] Test sign in
- [ ] Create a moment and verify it saves
- [ ] Sign out and sign back in
- [ ] Verify moments are still there

---

**Need help?** Check the troubleshooting section above or let me know! 🚀

