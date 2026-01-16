/**
 * DailySummariesStore - Persistence layer for DailySummary objects
 * 
 * CURRENT: Uses AsyncStorage for local persistence
 * FUTURE: Will migrate to GCP Storage or Firebase for production
 * 
 * This store manages AI-generated daily memory summaries (not individual moments).
 * Each summary represents a day's worth of moments compiled into a single memory.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemoryEntry } from '../types/MemoryEntry';
import * as FirestoreService from '../services/firestoreService';
import { getCurrentUser } from '../services/authService';

export interface DailySummary {
  id: string; // Unique ID for this summary
  date: string; // Date string (toDateString() format)
  count: number; // Number of moments used to generate this summary
  summary: string; // Brief summary (5-12 words)
  description?: string; // Detailed description from Gemini
  highlights: string[]; // Top highlights from the day
  memories: MemoryEntry[]; // The moments used to generate this summary
  warnings?: string[]; // Data quality warnings
  dataQuality?: 'excellent' | 'good' | 'limited' | 'minimal'; // Data quality level
}

const STORAGE_KEY = 'mnemo_daily_summaries';

/**
 * In-memory cache to avoid re-reading from AsyncStorage on every call
 */
let summariesCache: DailySummary[] | null = null;
let cacheInitialized = false;

/**
 * Load all daily summaries from Firestore (if logged in) or AsyncStorage
 * Tries Firestore first, then falls back to AsyncStorage
 */
export async function loadDailySummaries(): Promise<DailySummary[]> {
  // Return cached data if available
  if (cacheInitialized && summariesCache !== null) {
    return summariesCache;
  }
  
  const user = getCurrentUser();
  
  if (user) {
    // Try loading from Firestore first
    try {
      const firestoreMemories = await FirestoreService.getMemories(user.uid);
      // Filter to only get DailySummary objects (have `highlights` field)
      summariesCache = firestoreMemories.filter((m: any) => 
        m.highlights !== undefined
      ) as unknown as DailySummary[];
      cacheInitialized = true;
      console.log(`☁️ [DailySummariesStore] Loaded ${summariesCache.length} daily summar${summariesCache.length === 1 ? 'y' : 'ies'} from Firestore`);
      return summariesCache;
    } catch (error) {
      console.warn(`⚠️ [DailySummariesStore] Firestore load failed, trying AsyncStorage...`, error);
    }
  }
  
  // Fallback to AsyncStorage
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      summariesCache = [];
      cacheInitialized = true;
      return [];
    }
    
    summariesCache = JSON.parse(data) as DailySummary[];
    cacheInitialized = true;
    console.log(`📖 [DailySummariesStore] Loaded ${summariesCache.length} daily summar${summariesCache.length === 1 ? 'y' : 'ies'} from AsyncStorage`);
    return summariesCache;
  } catch (error) {
    console.error('❌ [DailySummariesStore] Error loading daily summaries:', error);
    summariesCache = [];
    cacheInitialized = true;
    return [];
  }
}

/**
 * Save all daily summaries to AsyncStorage and update cache
 * 
 * TODO: For production, migrate to GCP Storage or Firebase
 * - GCP: Use Cloud Storage buckets with user-specific paths
 * - Firebase: Use Firestore collections with user authentication
 */
export async function saveDailySummaries(summaries: DailySummary[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(summaries));
    summariesCache = summaries;
    cacheInitialized = true;
    console.log(`💾 [DailySummariesStore] Saved ${summaries.length} daily summar${summaries.length === 1 ? 'y' : 'ies'} to storage`);
  } catch (error) {
    console.error('❌ [DailySummariesStore] Error saving daily summaries:', error);
    throw error;
  }
}

/**
 * Add or update a daily summary
 * If a summary for the same date exists, it will be replaced
 * Saves to Firestore if logged in, AsyncStorage otherwise
 */
export async function saveDailySummary(summary: DailySummary): Promise<void> {
  const user = getCurrentUser();
  
  // Ensure summary has an ID
  if (!summary.id) {
    summary.id = `summary_${summary.date.replace(/\s+/g, '_')}`;
  }
  
  if (user) {
    // Save to Firestore
    try {
      await FirestoreService.saveMemory(user.uid, summary);
      console.log(`☁️ [DailySummariesStore] Saved summary for ${summary.date} to Firestore`);
    } catch (error) {
      console.warn(`⚠️ [DailySummariesStore] Firestore save failed, saving to AsyncStorage only`, error);
    }
  }
  
  // Also save to AsyncStorage as local cache
  const summaries = await loadDailySummaries();
  
  // Find existing summary for this date
  const existingIndex = summaries.findIndex(s => s.date === summary.date);
  
  if (existingIndex >= 0) {
    // Replace existing summary
    summaries[existingIndex] = summary;
    console.log(`🔄 [DailySummariesStore] Updated summary for ${summary.date}`);
  } else {
    // Add new summary
    summaries.push(summary);
    console.log(`➕ [DailySummariesStore] Added new summary for ${summary.date}`);
  }
  
  // Sort by date (newest first)
  summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  await saveDailySummaries(summaries);
}

/**
 * Delete a daily summary by date
 * 
 * TODO: For production, migrate to GCP Storage or Firebase
 */
export async function deleteDailySummary(date: string): Promise<void> {
  const summaries = await loadDailySummaries();
  const filtered = summaries.filter(s => s.date !== date);
  
  if (filtered.length === summaries.length) {
    console.warn(`⚠️ [DailySummariesStore] No summary found for date: ${date}`);
    return;
  }
  
  await saveDailySummaries(filtered);
  console.log(`🗑️ [DailySummariesStore] Deleted summary for ${date}`);
}

/**
 * Get a daily summary for a specific date
 * 
 * TODO: For production, migrate to GCP Storage or Firebase
 */
export async function getDailySummary(date: string): Promise<DailySummary | null> {
  const summaries = await loadDailySummaries();
  return summaries.find(s => s.date === date) || null;
}

/**
 * Delete all daily summaries
 * 
 * TODO: For production, migrate to GCP Storage or Firebase
 */
export async function deleteAllDailySummaries(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    summariesCache = [];
    cacheInitialized = true;
    console.log(`🗑️ [DailySummariesStore] Deleted all daily summaries`);
  } catch (error) {
    console.error('❌ [DailySummariesStore] Error deleting all daily summaries:', error);
    throw error;
  }
}

/**
 * Clear the in-memory cache (useful for testing or forced refresh)
 */
export function clearCache(): void {
  summariesCache = null;
  cacheInitialized = false;
}

// Export all functions as a named export object for compatibility
export const dailySummariesStore = {
  loadDailySummaries,
  saveDailySummaries,
  saveDailySummary,
  deleteDailySummary,
  getDailySummary,
  deleteAllDailySummaries,
  clearCache,
};

