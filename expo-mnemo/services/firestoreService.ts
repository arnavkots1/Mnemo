import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  Timestamp,
  writeBatch,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MemoryEntry } from '../types/MemoryEntry';
import { DailySummary } from '../store/DailySummariesStore';

const MOMENTS_COLLECTION = 'moments';
const MEMORIES_COLLECTION = 'memories';

/**
 * Save a moment to Firestore
 */
export const saveMoment = async (userId: string, moment: MemoryEntry): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const momentRef = doc(db, MOMENTS_COLLECTION, moment.id);
    const momentData = {
      ...moment,
      userId,
      createdAt: Timestamp.fromDate(new Date(moment.startTime)),
      updatedAt: Timestamp.now(),
    };

    await setDoc(momentRef, momentData);
    console.log('✅ Moment saved to Firestore:', moment.id);
  } catch (error) {
    console.error('❌ Error saving moment:', error);
    throw error;
  }
};

/**
 * Get all moments for a user
 */
export const getMoments = async (userId: string): Promise<MemoryEntry[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const momentsRef = collection(db, MOMENTS_COLLECTION);
    const q = query(
      momentsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const moments: MemoryEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      moments.push({
        ...data,
        id: doc.id,
      } as MemoryEntry);
    });

    console.log(`✅ Loaded ${moments.length} moments from Firestore`);
    return moments;
  } catch (error) {
    console.error('❌ Error loading moments:', error);
    throw error;
  }
};

/**
 * Get moments for a specific date range
 */
export const getMomentsByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MemoryEntry[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const momentsRef = collection(db, MOMENTS_COLLECTION);
    const q = query(
      momentsRef,
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const moments: MemoryEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      moments.push({
        ...data,
        id: doc.id,
      } as MemoryEntry);
    });

    return moments;
  } catch (error) {
    console.error('❌ Error loading moments by date:', error);
    throw error;
  }
};

/**
 * Delete a moment
 */
export const deleteMoment = async (userId: string, momentId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const momentRef = doc(db, MOMENTS_COLLECTION, momentId);
    const momentDoc = await getDoc(momentRef);

    if (!momentDoc.exists()) {
      throw new Error('Moment not found');
    }

    const momentData = momentDoc.data();
    if (momentData.userId !== userId) {
      throw new Error('Unauthorized: Cannot delete another user\'s moment');
    }

    await deleteDoc(momentRef);
    console.log('✅ Moment deleted:', momentId);
  } catch (error) {
    console.error('❌ Error deleting moment:', error);
    throw error;
  }
};

/**
 * Save a daily summary (memory) to Firestore
 */
export const saveMemory = async (userId: string, memory: DailySummary): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const memoryRef = doc(db, MEMORIES_COLLECTION, memory.id);
    const memoryData = {
      ...memory,
      userId,
      updatedAt: Timestamp.now(),
    };

    await setDoc(memoryRef, memoryData);
    console.log('✅ Memory saved to Firestore:', memory.id);
  } catch (error) {
    console.error('❌ Error saving memory:', error);
    throw error;
  }
};

/**
 * Get all memories for a user
 */
export const getMemories = async (userId: string): Promise<DailySummary[]> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const memoriesRef = collection(db, MEMORIES_COLLECTION);
    const q = query(
      memoriesRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const memories: DailySummary[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      memories.push({
        ...data,
        id: doc.id,
      } as DailySummary);
    });

    console.log(`✅ Loaded ${memories.length} memories from Firestore`);
    return memories;
  } catch (error) {
    console.error('❌ Error loading memories:', error);
    throw error;
  }
};

/**
 * Delete a memory
 */
export const deleteMemory = async (userId: string, memoryId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const memoryRef = doc(db, MEMORIES_COLLECTION, memoryId);
    const memoryDoc = await getDoc(memoryRef);

    if (!memoryDoc.exists()) {
      throw new Error('Memory not found');
    }

    const memoryData = memoryDoc.data();
    if (memoryData.userId !== userId) {
      throw new Error('Unauthorized: Cannot delete another user\'s memory');
    }

    await deleteDoc(memoryRef);
    console.log('✅ Memory deleted:', memoryId);
  } catch (error) {
    console.error('❌ Error deleting memory:', error);
    throw error;
  }
};

/**
 * Batch save multiple moments (useful for migration)
 */
export const batchSaveMoments = async (userId: string, moments: MemoryEntry[]): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const batch = writeBatch(db);
    
    moments.forEach((moment) => {
      const momentRef = doc(db, MOMENTS_COLLECTION, moment.id);
      const momentData = {
        ...moment,
        userId,
        createdAt: Timestamp.fromDate(new Date(moment.startTime)),
        updatedAt: Timestamp.now(),
      };
      batch.set(momentRef, momentData);
    });

    await batch.commit();
    console.log(`✅ Batch saved ${moments.length} moments to Firestore`);
  } catch (error) {
    console.error('❌ Error batch saving moments:', error);
    throw error;
  }
};

/**
 * Batch save multiple memories (useful for migration)
 */
export const batchSaveMemories = async (userId: string, memories: DailySummary[]): Promise<void> => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  try {
    const batch = writeBatch(db);
    
    memories.forEach((memory) => {
      const memoryRef = doc(db, MEMORIES_COLLECTION, memory.id);
      const memoryData = {
        ...memory,
        userId,
        updatedAt: Timestamp.now(),
      };
      batch.set(memoryRef, memoryData);
    });

    await batch.commit();
    console.log(`✅ Batch saved ${memories.length} memories to Firestore`);
  } catch (error) {
    console.error('❌ Error batch saving memories:', error);
    throw error;
  }
};

