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
  return {
    id: generateUUID(),
    kind,
    startTime: (options?.startTime || new Date()).toISOString(),
    endTime: options?.endTime?.toISOString(),
    latitude: options?.latitude,
    longitude: options?.longitude,
    placeName: options?.placeName,
    activityType: options?.activityType,
    summary,
    details: options?.details || {},
  };
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

