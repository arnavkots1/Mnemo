/**
 * MemoryContext - React Context for global memory state management
 * 
 * Provides:
 * - memories state and setMemories updater
 * - Convenience methods to add/update/delete via the store
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
  memories: MemoryEntry[];
  setMemories: React.Dispatch<React.SetStateAction<MemoryEntry[]>>;
  addMemory: (memory: MemoryEntry) => Promise<void>;
  updateMemory: (memory: MemoryEntry) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  refreshMemories: () => Promise<void>;
  getMemoriesForDay: (date: Date) => Promise<MemoryEntry[]>;
  getRecentMoments: (limit: number) => Promise<MemoryEntry[]>;
  deleteAllMemories: () => Promise<void>;
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
   * Load memories from store on mount
   */
  useEffect(() => {
    const loadInitialMemories = async () => {
      try {
        setIsLoading(true);
        const loadedMemories = await loadMemories();
        setMemories(loadedMemories);
      } catch (error) {
        console.error('Error loading initial memories:', error);
        // Set empty array on error to prevent app crash
        setMemories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialMemories();
  }, []);

  /**
   * Add a new memory
   */
  const addMemory = useCallback(async (memory: MemoryEntry) => {
    try {
      await addMemoryToStore(memory);
      // Update local state immediately for responsive UI
      setMemories((prev) => [...prev, memory]);
      // Also refresh from store to ensure consistency
      const updatedMemories = await loadMemories();
      setMemories(updatedMemories);
    } catch (error) {
      console.error('Error adding memory:', error);
      // Still update local state even if store save fails
      setMemories((prev) => [...prev, memory]);
      // Don't throw - gracefully handle error
    }
  }, []);

  /**
   * Update an existing memory
   */
  const updateMemory = useCallback(async (memory: MemoryEntry) => {
    try {
      await updateMemoryInStore(memory);
      // Refresh from store to ensure consistency
      const updatedMemories = await loadMemories();
      setMemories(updatedMemories);
    } catch (error) {
      console.error('Error updating memory:', error);
      // Update local state even if store update fails
      setMemories((prev) => prev.map(m => m.id === memory.id ? memory : m));
      // Don't throw - gracefully handle error
    }
  }, []);

  /**
   * Delete a memory by ID
   */
  const deleteMemory = useCallback(async (id: string) => {
    try {
      const updatedMemories = memories.filter(m => m.id !== id);
      await saveMemories(updatedMemories);
      setMemories(updatedMemories);
    } catch (error) {
      console.error('Error deleting memory:', error);
      // Update local state even if store save fails
      setMemories((prev) => prev.filter(m => m.id !== id));
      // Don't throw - gracefully handle error
    }
  }, [memories]);

  /**
   * Refresh memories from store
   */
  const refreshMemories = useCallback(async () => {
    try {
      console.log('🔄 MemoryContext: Refreshing memories from store...');
      const loadedMemories = await loadMemories();
      console.log(`📊 MemoryContext: Loaded ${loadedMemories.length} memories from store`);
      setMemories(loadedMemories);
      console.log(`✅ MemoryContext: Updated state with ${loadedMemories.length} memories`);
    } catch (error) {
      console.error('❌ MemoryContext: Error refreshing memories:', error);
      // Don't throw - gracefully handle error, keep existing memories
    }
  }, []);

  /**
   * Get memories for a specific day
   */
  const getMemoriesForDay = useCallback(async (date: Date): Promise<MemoryEntry[]> => {
    try {
      return await getMemoriesForDayFromStore(date);
    } catch (error) {
      console.error('Error getting memories for day:', error);
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
   * Delete all memories
   */
  const deleteAllMemories = useCallback(async () => {
    try {
      console.log('🗑️ MemoryContext: Deleting all memories...');
      await deleteAllMemoriesFromStore();
      setMemories([]);
      console.log('✅ MemoryContext: All memories deleted and state cleared');
      
      // Verify deletion worked
      const remainingMemories = await loadMemories();
      console.log(`📊 MemoryContext: Verification - ${remainingMemories.length} memories remain in store`);
      if (remainingMemories.length > 0) {
        console.warn('⚠️ MemoryContext: Some memories still exist after deletion!');
      }
    } catch (error) {
      console.error('❌ MemoryContext: Error deleting all memories:', error);
      // Still clear local state even if store delete fails
      setMemories([]);
      // Don't throw - gracefully handle error
    }
  }, []);

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

