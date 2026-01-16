import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

/**
 * Sign up with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Send email verification
    await sendEmailVerification(user);

    return {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized.');
  }

  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized.');
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthState = (callback: (user: AuthUser | null) => void) => {
  if (!auth) {
    console.warn('Firebase Auth not initialized. Auth state listener not active.');
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      });
    } else {
      callback(null);
    }
  });
};

/**
 * Get current user
 */
export const getCurrentUser = (): AuthUser | null => {
  if (!auth || !auth.currentUser) {
    return null;
  }

  const user = auth.currentUser;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
};

/**
 * Convert Firebase error codes to user-friendly messages
 */
const getAuthErrorMessage = (code: string): string => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign in is not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred. Please try again.';
  }
};

