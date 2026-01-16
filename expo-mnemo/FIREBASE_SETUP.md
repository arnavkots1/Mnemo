# 🔥 Firebase Setup Instructions

## Step 1: Create Firebase Project (5 minutes)

1. **Go to:** https://console.firebase.google.com/
2. **Click "Add project"**
3. **Project name:** `Mnemo` (or whatever you want)
4. **Google Analytics:** Disable for now (you can enable later)
5. **Click "Create project"**

---

## Step 2: Add Web App to Firebase (3 minutes)

1. **In your Firebase project**, click the **web icon** (`</>`) to add a web app
2. **App nickname:** `Mnemo Web`
3. **Firebase Hosting:** Don't check it
4. **Click "Register app"**
5. **Copy the config object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

6. **Save this - you'll add it to `.env` in Step 5**


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCCX8iuYNL1DB7znNjddrRagYjSfWJzLvY",
  authDomain: "mnemo-97839.firebaseapp.com",
  projectId: "mnemo-97839",
  storageBucket: "mnemo-97839.firebasestorage.app",
  messagingSenderId: "718110020581",
  appId: "1:718110020581:web:45db9159d5f551b0dd950c",
  measurementId: "G-WJEXFBSRTZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
---

## Step 3: Enable Authentication (2 minutes)

1. **In Firebase Console**, go to **"Build" → "Authentication"**
2. **Click "Get started"**
3. **Click "Sign-in method" tab**
4. **Enable these providers:**
   - ✅ **Email/Password** (click, toggle on, save)
   - ✅ **Google** (click, toggle on, add support email, save)

---

## Step 4: Create Firestore Database (2 minutes)

1. **In Firebase Console**, go to **"Build" → "Firestore Database"**
2. **Click "Create database"**
3. **Start in:** Production mode (we'll add rules later)
4. **Location:** Choose closest to you (e.g., `us-central1` or `asia-south1`)
5. **Click "Enable"**

---

## Step 5: Enable Storage (1 minute)

1. **In Firebase Console**, go to **"Build" → "Storage"**
2. **Click "Get started"**
3. **Start in:** Production mode
4. **Click "Done"**

---

## Step 6: Add Config to `.env` File

**I'll create a template `.env` file for you - you just need to fill in the values from Step 2!**

The file will be at: `expo-mnemo/.env`

---

## ✅ Once You're Done:

1. **Run:** `npm install` in `expo-mnemo/` folder
2. **Tell me you're ready** and I'll test it!

---

## 🔐 Security Rules (I'll set these up in code):

- **Firestore:** Users can only read/write their own data
- **Storage:** Users can only upload to their own folder
- **Auth:** Email verification optional (can enable later)

---

## 💰 Pricing:

Firebase **Free Tier** (Spark Plan):
- ✅ **1 GB storage**
- ✅ **10 GB bandwidth/month**
- ✅ **50K reads/day**
- ✅ **20K writes/day**
- ✅ **Unlimited authentication**

**You'll be fine on the free tier for personal use!** 🎉

