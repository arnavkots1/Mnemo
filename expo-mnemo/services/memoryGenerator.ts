/**
 * MemoryGenerator - Generates memory summaries from images and location context
 * 
 * Uses location context and image metadata to create meaningful memory summaries.
 */

import { MemoryEntry } from '../types/MemoryEntry';
import * as Location from 'expo-location';

export interface MemoryGenerationContext {
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
  };
  imageMetadata?: {
    creationTime?: Date;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  timeOfDay?: string;
  dayOfWeek?: string;
}

/**
 * Generate a summary for a photo memory based on context
 */
export function generatePhotoMemorySummary(
  context: MemoryGenerationContext
): string {
  const parts: string[] = [];
  
  // Add time context
  if (context.timeOfDay) {
    const timeLabels: { [key: string]: string } = {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night',
    };
    parts.push(timeLabels[context.timeOfDay] || context.timeOfDay);
  }
  
  // Add location context
  if (context.location?.placeName) {
    parts.push(`at ${context.location.placeName}`);
  } else if (context.imageMetadata?.location) {
    parts.push('with location');
  }
  
  // Add day context for special days
  if (context.dayOfWeek) {
    const day = context.dayOfWeek.toLowerCase();
    if (day === 'saturday' || day === 'sunday') {
      parts.push(`on ${context.dayOfWeek}`);
    }
  }
  
  if (parts.length === 0) {
    return 'Photo moment';
  }
  
  return parts.join(' ') + ' photo';
}

/**
 * Generate a summary for a context memory based on location
 */
export function generateContextMemorySummary(
  placeName?: string,
  latitude?: number,
  longitude?: number
): string {
  if (placeName) {
    return `At ${placeName}`;
  }
  
  if (latitude && longitude) {
    // Try to get a simple description
    return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
  
  return 'Location update';
}

/**
 * Get time of day label from date
 */
export function getTimeOfDay(date: Date): string {
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Get day of week name
 */
export function getDayOfWeek(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Enhance a memory entry with generated summary based on context
 */
export function enhanceMemoryWithContext(memory: MemoryEntry): MemoryEntry {
  const memoryDate = new Date(memory.startTime);
  const context: MemoryGenerationContext = {
    location: memory.latitude && memory.longitude ? {
      latitude: memory.latitude,
      longitude: memory.longitude,
      placeName: memory.placeName,
    } : undefined,
    timeOfDay: getTimeOfDay(memoryDate),
    dayOfWeek: getDayOfWeek(memoryDate),
  };
  
  // Generate summary based on memory kind
  if (memory.kind === 'photo' && memory.summary === 'Photo moment') {
    return {
      ...memory,
      summary: generatePhotoMemorySummary(context),
    };
  }
  
  if (memory.kind === 'context' && (!memory.summary || memory.summary.includes('Moved to'))) {
    return {
      ...memory,
      summary: generateContextMemorySummary(memory.placeName, memory.latitude, memory.longitude),
    };
  }
  
  return memory;
}

