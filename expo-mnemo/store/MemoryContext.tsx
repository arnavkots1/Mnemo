/**
 * MemoryContext - React Context for global MOMENTS state management
 * 
 * NOTE: This manages MOMENTS (individual entries), not MEMORIES (daily summaries)
 * - Moments = individual memory entries (photos, voice notes, locations)
 * - Memories = AI-generated daily summaries (managed separately in MemoriesScreen)
 * 
 * Provides:
 * - moments state and setMoments updater
 * - Convenience methods to add/update/delete moments via the store
 * - Automatic sync with MemoryStore
 * - Easy subscription for screens
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MemoryEntry } from '../types/MemoryEntry';
import * as MemoryStoreModule from './MemoryStore';

// Try to use direct function imports, fallback to object if needed
const loadMemories = MemoryStoreModule.loadMemories || MemoryStoreModule.memoryStore?.loadMemories;
const addMemoryToStore = MemoryStoreModule.addMemory || MemoryStoreModule.memoryStore?.addMemory;
const updateMemoryInStore = MemoryStoreModule.updateMemory || MemoryStoreModule.memoryStore?.updateMemory;
const saveMemories = MemoryStoreModule.saveMemories || MemoryStoreModule.memoryStore?.saveMemories;
const getMemoriesForDayFromStore = MemoryStoreModule.getMemoriesForDay || MemoryStoreModule.memoryStore?.getMemoriesForDay;
const getRecentMomentsFromStore = MemoryStoreModule.getRecentMoments || MemoryStoreModule.memoryStore?.getRecentMoments;
const deleteAllMemoriesFromStore = MemoryStoreModule.deleteAllMemories || MemoryStoreModule.memoryStore?.deleteAllMemories;

// Validate all functions are available
if (!loadMemories || !addMemoryToStore || !saveMemories) {
  console.error('MemoryStore functions not available. Available exports:', Object.keys(MemoryStoreModule));
}

interface MemoryContextType {
  memories: MemoryEntry[]; // NOTE: These are MOMENTS (individual entries), kept as 'memories' for backward compatibility
  setMemories: React.Dispatch<React.SetStateAction<MemoryEntry[]>>;
  addMemory: (moment: MemoryEntry) => Promise<void>; // Adds a MOMENT
  updateMemory: (moment: MemoryEntry) => Promise<void>; // Updates a MOMENT
  deleteMemory: (id: string) => Promise<void>; // Deletes a MOMENT
  refreshMemories: () => Promise<void>; // Refreshes MOMENTS from store
  getMemoriesForDay: (date: Date) => Promise<MemoryEntry[]>; // Gets MOMENTS for a day
  getRecentMoments: (limit: number) => Promise<MemoryEntry[]>; // Gets recent MOMENTS
  deleteAllMemories: () => Promise<void>; // Deletes all MOMENTS
  isLoading: boolean;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

/**
 * MemoryProvider - Provides memory context to the app
 */
export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load moments from store on mount
   */
  useEffect(() => {
    const loadInitialMoments = async () => {
      try {
        setIsLoading(true);
        const loadedMoments = await loadMemories();
        console.log(`📊 [MEMORY_CONTEXT] Loaded ${loadedMoments.length} moment${loadedMoments.length === 1 ? '' : 's'} on mount`);
        setMemories(loadedMoments);
      } catch (error) {
        console.error('❌ [MEMORY_CONTEXT] Error loading initial moments:', error);
        // Set empty array on error to prevent app crash
        setMemories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialMoments();
  }, []);

  /**
   * Add a new MOMENT (not a memory summary)
   */
  const addMemory = useCallback(async (moment: MemoryEntry) => {
    try {
      console.log(`➕ [MEMORY_CONTEXT] Adding moment: ${moment.id} - "${moment.summary}"`);
      await addMemoryToStore(moment);
      console.log(`✅ [MEMORY_CONTEXT] Moment saved to store`);
      
      // Update local state immediately for responsive UI
      setMemories((prev) => {
        const updated = [...prev, moment];
        console.log(`📊 [MEMORY_CONTEXT] State updated: ${updated.length} total moment${updated.length === 1 ? '' : 's'}`);
        return updated;
      });
      
      // Small delay to ensure state propagation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Also refresh from store to ensure consistency
      const updatedMoments = await loadMemories();
      setMemories(updatedMoments);
      console.log(`🔄 [MEMORY_CONTEXT] Verified state: ${updatedMoments.length} total moment${updatedMoments.length === 1 ? '' : 's'}`);
    } catch (error) {
      console.error(`❌ [MEMORY_CONTEXT] Error adding moment ${moment.id}:`, error);
      // Still update local state even if store save fails
      setMemories((prev) => [...prev, moment]);
      // Don't throw - gracefully handle error
    }
  }, []);

  /**
   * Update an existing MOMENT
   */
  const updateMemory = useCallback(async (moment: MemoryEntry) => {
    try {
      console.log(`🔄 [MEMORY_CONTEXT] Updating moment: ${moment.id}`);
      await updateMemoryInStore(moment);
      // Refresh from store to ensure consistency
      const updatedMoments = await loadMemories();
      setMemories(updatedMoments);
      console.log(`✅ [MEMORY_CONTEXT] Moment updated: ${updatedMoments.length} total`);
    } catch (error) {
      console.error(`❌ [MEMORY_CONTEXT] Error updating moment ${moment.id}:`, error);
      // Update local state even if store update fails
      setMemories((prev) => prev.map(m => m.id === moment.id ? moment : m));
      // Don't throw - gracefully handle error
    }
  }, []);

  /**
   * Delete a MOMENT by ID
   */
  const deleteMemory = useCallback(async (id: string) => {
    try {
      const momentToDelete = memories.find(m => m.id === id);
      console.log(`🗑️ [MEMORY_CONTEXT] Deleting moment: ${id}${momentToDelete ? ` - "${momentToDelete.summary}"` : ''}`);
      
      const updatedMoments = memories.filter(m => m.id !== id);
      await saveMemories(updatedMoments);
      setMemories(updatedMoments);
      console.log(`✅ [MEMORY_CONTEXT] Moment deleted: ${updatedMoments.length} moment${updatedMoments.length === 1 ? '' : 's'} remaining`);
    } catch (error) {
      console.error(`❌ [MEMORY_CONTEXT] Error deleting moment ${id}:`, error);
      // Update local state even if store save fails
      setMemories((prev) => {
        const filtered = prev.filter(m => m.id !== id);
        console.log(`🔄 [MEMORY_CONTEXT] Local state updated: ${filtered.length} moment${filtered.length === 1 ? '' : 's'} remaining`);
        return filtered;
      });
      // Don't throw - gracefully handle error
    }
  }, [memories]);

  /**
   * Refresh MOMENTS from store
   */
  const refreshMemories = useCallback(async () => {
    try {
      console.log('🔄 [MEMORY_CONTEXT] Refreshing moments from store...');
      const loadedMoments = await loadMemories();
      console.log(`📊 [MEMORY_CONTEXT] Loaded ${loadedMoments.length} moment${loadedMoments.length === 1 ? '' : 's'} from store`);
      setMemories(loadedMoments);
      console.log(`✅ [MEMORY_CONTEXT] Updated state with ${loadedMoments.length} moment${loadedMoments.length === 1 ? '' : 's'}`);
      if (loadedMoments.length > 0) {
        console.log(`   📋 [MEMORY_CONTEXT] Sample moments:`, loadedMoments.slice(0, 3).map(m => ({ id: m.id, summary: m.summary, kind: m.kind })));
      }
    } catch (error) {
      console.error('❌ [MEMORY_CONTEXT] Error refreshing moments:', error);
      // Don't throw - gracefully handle error, keep existing moments
    }
  }, []);

  /**
   * Get MOMENTS for a specific day
   */
  const getMemoriesForDay = useCallback(async (date: Date): Promise<MemoryEntry[]> => {
    try {
      const moments = await getMemoriesForDayFromStore(date);
      console.log(`📅 [MEMORY_CONTEXT] Got ${moments.length} moment${moments.length === 1 ? '' : 's'} for ${date.toDateString()}`);
      return moments;
    } catch (error) {
      console.error(`❌ [MEMORY_CONTEXT] Error getting moments for day:`, error);
      return []; // Return empty array on error
    }
  }, []);

  /**
   * Get recent moments
   */
  const getRecentMoments = useCallback(async (limit: number): Promise<MemoryEntry[]> => {
    try {
      return await getRecentMomentsFromStore(limit);
    } catch (error) {
      console.error('Error getting recent moments:', error);
      return []; // Return empty array on error
    }
  }, []);

  /**
   * Delete all MOMENTS
   */
  const deleteAllMemories = useCallback(async () => {
    try {
      const countBefore = memories.length;
      console.log(`🗑️ [MEMORY_CONTEXT] Deleting all ${countBefore} moment${countBefore === 1 ? '' : 's'}...`);
      await deleteAllMemoriesFromStore();
      setMemories([]);
      console.log(`✅ [MEMORY_CONTEXT] All ${countBefore} moment${countBefore === 1 ? '' : 's'} deleted and state cleared`);
      
      // Verify deletion worked
      const remainingMoments = await loadMemories();
      console.log(`📊 [MEMORY_CONTEXT] Verification - ${remainingMoments.length} moment${remainingMoments.length === 1 ? '' : 's'} remain in store`);
      if (remainingMoments.length > 0) {
        console.warn(`⚠️ [MEMORY_CONTEXT] Some moments still exist after deletion!`);
      }
    } catch (error) {
      console.error('❌ [MEMORY_CONTEXT] Error deleting all moments:', error);
      // Still clear local state even if store delete fails
      setMemories([]);
      // Don't throw - gracefully handle error
    }
  }, [memories]);

  const value: MemoryContextType = {
    memories,
    setMemories,
    addMemory,
    updateMemory,
    deleteMemory,
    refreshMemories,
    getMemoriesForDay,
    getRecentMoments,
    deleteAllMemories,
    isLoading,
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
};

/**
 * Hook to use MemoryContext
 * 
 * @throws Error if used outside MemoryProvider
 */
export function useMemoryContext(): MemoryContextType {
  const context = useContext(MemoryContext);
  if (context === undefined) {
    throw new Error('useMemoryContext must be used within a MemoryProvider');
  }
  return context;
}

