/**
 * AudioStorageService - Manages persistent audio file storage
 * 
 * Saves audio recordings to permanent storage so they can be accessed later.
 */

import * as FileSystem from 'expo-file-system/legacy';

const AUDIO_DIR = `${FileSystem.documentDirectory}audio/`;

/**
 * Ensure audio directory exists
 */
async function ensureAudioDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
}

/**
 * Save audio file to permanent storage
 * 
 * @param tempUri - Temporary URI from expo-av recording
 * @param memoryId - Memory entry ID to use as filename
 * @returns Permanent URI for the saved audio file
 */
export async function saveAudioFile(tempUri: string, memoryId: string): Promise<string> {
  try {
    await ensureAudioDirectory();
    
    // Create filename from memory ID
    const fileName = `audio_${memoryId}.m4a`;
    const permanentUri = `${AUDIO_DIR}${fileName}`;
    
    // Copy from temp location to permanent location
    await FileSystem.copyAsync({
      from: tempUri,
      to: permanentUri,
    });
    
    console.log(`Audio saved: ${permanentUri}`);
    return permanentUri;
  } catch (error) {
    console.error('Error saving audio file:', error);
    // Return original URI if save fails
    return tempUri;
  }
}

/**
 * Get audio file URI (checks if file exists)
 */
export async function getAudioUri(memoryId: string): Promise<string | null> {
  try {
    const fileName = `audio_${memoryId}.m4a`;
    const uri = `${AUDIO_DIR}${fileName}`;
    
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      return uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking audio file:', error);
    return null;
  }
}

/**
 * Delete audio file
 */
export async function deleteAudioFile(memoryId: string): Promise<void> {
  try {
    const fileName = `audio_${memoryId}.m4a`;
    const uri = `${AUDIO_DIR}${fileName}`;
    
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch (error) {
    console.error('Error deleting audio file:', error);
  }
}

/**
 * Get all audio files (for cleanup/maintenance)
 */
export async function getAllAudioFiles(): Promise<string[]> {
  try {
    await ensureAudioDirectory();
    const files = await FileSystem.readDirectoryAsync(AUDIO_DIR);
    return files.filter(file => file.endsWith('.m4a'));
  } catch (error) {
    console.error('Error listing audio files:', error);
    return [];
  }
}

