import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase config
const validateFirebaseConfig = () => {
  const missingKeys = [];
  if (!firebaseConfig.apiKey) missingKeys.push('EXPO_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missingKeys.push('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missingKeys.push('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missingKeys.push('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId) missingKeys.push('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) missingKeys.push('EXPO_PUBLIC_FIREBASE_APP_ID');

  if (missingKeys.length > 0) {
    console.error('❌ Missing Firebase config keys:', missingKeys.join(', '));
    console.error('📝 Please add these to your .env file');
    console.error('📚 See FIREBASE_SETUP.md for instructions');
    return false;
  }
  return true;
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  if (!validateFirebaseConfig()) {
    console.warn('⚠️ Firebase not configured - running in local-only mode');
  } else {
    // Initialize Firebase app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized');
    } else {
      app = getApp();
    }

    // Initialize Auth
    // Note: Firebase automatically handles persistence in React Native/Expo
    auth = getAuth(app);

    // Initialize Firestore
    db = getFirestore(app);

    // Initialize Storage
    storage = getStorage(app);

    console.log('🔥 Firebase services ready');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.warn('⚠️ Running in local-only mode');
}

export { app, auth, db, storage };

