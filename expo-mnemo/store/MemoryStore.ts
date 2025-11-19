/**
 * MemoryStore - Persistence layer for MemoryEntry objects
 * 
 * Uses AsyncStorage with in-memory cache to avoid frequent reads.
 * Implements the exact API specified in the architecture prompt.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemoryEntry } from '../types/MemoryEntry';

const STORAGE_KEY = 'mnemo_memories';

/**
 * In-memory cache to avoid re-reading from AsyncStorage on every call
 */
let memoryCache: MemoryEntry[] | null = null;
let cacheInitialized = false;

/**
 * Load all memories from AsyncStorage (with cache)
 */
export async function loadMemories(): Promise<MemoryEntry[]> {
  // Return cached data if available
  if (cacheInitialized && memoryCache !== null) {
    return memoryCache;
  }
  
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      memoryCache = [];
      cacheInitialized = true;
      return [];
    }
    
    memoryCache = JSON.parse(data) as MemoryEntry[];
    cacheInitialized = true;
    return memoryCache;
  } catch (error) {
    console.error('Error loading memories:', error);
    memoryCache = [];
    cacheInitialized = true;
    return [];
  }
}

/**
 * Save all memories to AsyncStorage and update cache
 */
export async function saveMemories(memories: MemoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    memoryCache = memories;
    cacheInitialized = true;
  } catch (error) {
    console.error('Error saving memories:', error);
    throw error;
  }
}

/**
 * Add a new memory entry
 */
export async function addMemory(memory: MemoryEntry): Promise<void> {
  const memories = await loadMemories();
  
  // Check if entry with same ID already exists
  if (memories.some(m => m.id === memory.id)) {
    throw new Error(`Memory entry with id ${memory.id} already exists`);
  }
  
  memories.push(memory);
  await saveMemories(memories);
}

/**
 * Update an existing memory entry
 */
export async function updateMemory(memory: MemoryEntry): Promise<void> {
  const memories = await loadMemories();
  const index = memories.findIndex(m => m.id === memory.id);
  
  if (index === -1) {
    throw new Error(`Memory entry with id ${memory.id} not found`);
  }
  
  memories[index] = memory;
  await saveMemories(memories);
}

/**
 * Get memories for a specific day
 */
export async function getMemoriesForDay(date: Date): Promise<MemoryEntry[]> {
  const allMemories = await loadMemories();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return allMemories.filter(memory => {
    const memoryDate = new Date(memory.startTime);
    return memoryDate >= startOfDay && memoryDate <= endOfDay;
  }).sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

/**
 * Get recent moments (emotional and photo) up to a limit
 */
export async function getRecentMoments(limit: number): Promise<MemoryEntry[]> {
  const allMemories = await loadMemories();
  const moments = allMemories.filter(memory => 
    memory.kind === 'emotional' || memory.kind === 'photo'
  );
  
  return moments
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, limit);
}

/**
 * Delete all memories
 */
export async function deleteAllMemories(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    memoryCache = [];
    cacheInitialized = true;
  } catch (error) {
    console.error('Error deleting all memories:', error);
    throw error;
  }
}

/**
 * Clear the in-memory cache (useful for testing or forced refresh)
 */
export function clearCache(): void {
  memoryCache = null;
  cacheInitialized = false;
}

// Export all functions as a named export object for compatibility
export const memoryStore = {
  loadMemories,
  saveMemories,
  addMemory,
  updateMemory,
  getMemoriesForDay,
  getRecentMoments,
  deleteAllMemories,
  clearCache,
};
