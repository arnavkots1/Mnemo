# Moments vs Memories - Gemini Service Separation

## Overview

The Gemini AI services are now clearly separated into two distinct systems:

### 1. **MOMENTS** (Individual Entries)
- **Service**: `geminiMomentsService.ts`
- **Purpose**: Analyzes individual moment entries (photos, audio, location check-ins)
- **Used by**: `/api/memory/analyze` endpoint
- **Focus**: Describes THIS specific moment - what's happening RIGHT NOW
- **Examples**:
  - A single photo: "Sunset over the city skyline"
  - An audio clip: "Excited voice note about project launch"
  - A location: "Coffee shop visit on Saturday morning"

### 2. **MEMORIES** (Daily Summaries)
- **Service**: `geminiMemoryService.ts`
- **Purpose**: Creates daily summaries from multiple moments
- **Used by**: `/api/daily-summaries` endpoint
- **Focus**: Aggregates and synthesizes a day's worth of moments into a cohesive narrative
- **Examples**:
  - "A productive Saturday with morning coffee, afternoon project work, and evening relaxation"
  - "Busy workday with team meetings and deadline pushes"

## Rate Limiting

Both services share the same rate limiter (`geminiRateLimiter.ts`) to ensure we stay within Gemini's free tier limits:

- **Per-minute limit**: 4 requests/minute (buffer from 5/min free tier)
- **Daily limit**: 500 requests/day (conservative)
- **Tracking**: Usage tracked by service (`moments` vs `memories`)

## File Structure

```
expo-mnemo-backend/src/services/
├── geminiMomentsService.ts      # Analyzes individual MOMENTS
├── geminiMemoryService.ts       # Creates daily MEMORIES (summaries)
├── geminiRateLimiter.ts         # Shared rate limiting
├── geminiService.ts             # Image analysis (legacy)
└── audioTranscriptionService.ts # Audio transcription
```

## Prompt Differences

### Moments Prompt
- Focus on **specific details** of THIS moment
- Describe what's happening RIGHT NOW
- Creative, varied language for each moment
- Examples: "What do you SEE in this photo?", "What was SAID in this audio?"

### Memories Prompt
- Focus on **patterns and themes** across multiple moments
- Create cohesive daily narratives
- Synthesize information from many sources
- Examples: "What was the overall theme of this day?", "How did these moments connect?"

## Usage

### Analyzing a Moment (Individual Entry)
```typescript
import { analyzeMomentWithGemini } from './services/geminiMomentsService';

const result = await analyzeMomentWithGemini({
  photoPath: '/path/to/photo.jpg',
  timestamp: new Date(),
  timeOfDay: 'morning',
  location: { placeName: 'Coffee Shop' }
});
// Result: "Morning coffee at the local café"
```

### Creating a Memory (Daily Summary)
```typescript
import { analyzeMemoryWithGemini } from './services/geminiMemoryService';

const result = await analyzeMemoryWithGemini({
  // Multiple moments from the day
  photoPath: '/path/to/photo.jpg',
  audioPath: '/path/to/audio.m4a',
  location: { placeName: 'Various locations' },
  timestamp: new Date(),
  // ... other data
});
// Result: "A productive day with morning coffee, afternoon meetings, and evening relaxation"
```

## Logging Prefixes

- `[Gemini Moments]` - Individual moment analysis
- `[Gemini Memories]` - Daily summary generation
- `[Gemini Rate Limiter]` - Shared rate limiting

## Key Differences

| Aspect | Moments | Memories |
|--------|---------|----------|
| **Scope** | Single entry | Multiple entries (day) |
| **Timeframe** | Instant/specific time | Full day |
| **Detail Level** | High (specific) | Medium (synthesized) |
| **Prompt Focus** | "What's happening NOW?" | "What was the day like?" |
| **Output Length** | 1-3 sentences | 2-4 sentences |
| **Creativity** | Very high (each unique) | High (cohesive narrative) |

## Why Separate?

1. **Clarity**: Clear distinction between individual entries and daily summaries
2. **Prompts**: Different prompts optimized for each use case
3. **Logging**: Easy to track usage by service type
4. **Maintenance**: Easier to update one without affecting the other
5. **Rate Limiting**: Shared limiter ensures we don't exceed quotas across both services

