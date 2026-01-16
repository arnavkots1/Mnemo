import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadResult,
} from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload a photo to Firebase Storage
 */
export const uploadPhoto = async (
  userId: string,
  momentId: string,
  photoUri: string
): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    // Fetch the photo as a blob
    const response = await fetch(photoUri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const fileName = `${momentId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, `users/${userId}/photos/${fileName}`);

    // Upload the photo
    console.log('📤 Uploading photo to Firebase Storage...');
    const uploadResult = await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('✅ Photo uploaded:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading photo:', error);
    throw error;
  }
};

/**
 * Upload audio to Firebase Storage
 */
export const uploadAudio = async (
  userId: string,
  momentId: string,
  audioUri: string
): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    // Fetch the audio as a blob
    const response = await fetch(audioUri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const fileName = `${momentId}_${Date.now()}.m4a`;
    const storageRef = ref(storage, `users/${userId}/audio/${fileName}`);

    // Upload the audio
    console.log('📤 Uploading audio to Firebase Storage...');
    const uploadResult = await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('✅ Audio uploaded:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading audio:', error);
    throw error;
  }
};

/**
 * Upload with progress callback
 */
export const uploadPhotoWithProgress = async (
  userId: string,
  momentId: string,
  photoUri: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    // Fetch the photo as a blob
    const response = await fetch(photoUri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const fileName = `${momentId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, `users/${userId}/photos/${fileName}`);

    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📤 Upload progress: ${progress.toFixed(0)}%`);
          onProgress?.(progress);
        },
        (error) => {
          console.error('❌ Upload error:', error);
          reject(error);
        },
        async () => {
          // Upload complete, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('✅ Photo uploaded:', downloadURL);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('❌ Error uploading photo:', error);
    throw error;
  }
};

/**
 * Delete a photo from Firebase Storage
 */
export const deletePhoto = async (photoURL: string): Promise<void> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const photoRef = ref(storage, photoURL);
    await deleteObject(photoRef);
    console.log('✅ Photo deleted from storage');
  } catch (error) {
    console.error('❌ Error deleting photo:', error);
    // Don't throw - file might already be deleted
  }
};

/**
 * Delete audio from Firebase Storage
 */
export const deleteAudio = async (audioURL: string): Promise<void> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const audioRef = ref(storage, audioURL);
    await deleteObject(audioRef);
    console.log('✅ Audio deleted from storage');
  } catch (error) {
    console.error('❌ Error deleting audio:', error);
    // Don't throw - file might already be deleted
  }
};

