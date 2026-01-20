/**
 * Memory entry types matching the iOS Swift version
 */

export type MemoryKind = "context" | "emotional" | "photo";

export type ActivityType = "stationary" | "walking" | "running" | "driving" | "unknown";

export interface MemoryEntry {
  id: string;                    // UUID
  kind: MemoryKind;
  startTime: string;             // ISO date string
  endTime?: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
  activityType?: ActivityType;
  summary: string;
  details?: Record<string, any>;  // transcript, emotion label, photo URI, etc.
}

/**
 * Helper function to create a new MemoryEntry
 */
export function createMemoryEntry(
  kind: MemoryKind,
  summary: string,
  options?: {
    startTime?: Date;
    endTime?: Date;
    latitude?: number;
    longitude?: number;
    placeName?: string;
    activityType?: ActivityType;
    details?: Record<string, any>;
  }
): MemoryEntry {
  const entry: MemoryEntry = {
    id: generateUUID(),
    kind,
    startTime: (options?.startTime || new Date()).toISOString(),
    summary,
    details: options?.details || {},
  };
  
  // Only add optional fields if they have values (avoid undefined for Firestore)
  if (options?.endTime) {
    entry.endTime = options.endTime.toISOString();
  }
  if (options?.latitude !== undefined) {
    entry.latitude = options.latitude;
  }
  if (options?.longitude !== undefined) {
    entry.longitude = options.longitude;
  }
  if (options?.placeName) {
    entry.placeName = options.placeName;
  }
  if (options?.activityType) {
    entry.activityType = options.activityType;
  }
  
  return entry;
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

