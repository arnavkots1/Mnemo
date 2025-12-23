/**
 * Daily Summaries Routes - Generate AI-powered daily memory summaries
 * 
 * POST /api/memory/daily-summaries - Generate summaries for all days with memories
 */

import express from 'express';
import { analyzeMemoryWithGemini } from '../services/geminiMemoryService';

const router = express.Router();

interface MemoryInput {
  id: string;
  kind: string;
  summary: string;
  startTime: string;
  details?: any;
}

/**
 * POST /api/memory/daily-summaries
 * 
 * Generate AI-powered daily summaries from memories
 */
router.post('/daily-summaries', async (req, res) => {
  try {
    const { memories } = req.body as { memories: MemoryInput[] };
    
    if (!memories || !Array.isArray(memories) || memories.length === 0) {
      return res.status(400).json({
        error: 'No memories provided',
        summaries: [],
      });
    }

    console.log(`[Daily Summaries] Generating summaries for ${memories.length} memories`);

    // Group memories by day
    const grouped = new Map<string, MemoryInput[]>();
    
    memories.forEach(memory => {
      try {
        const date = new Date(memory.startTime).toDateString();
        if (!grouped.has(date)) {
          grouped.set(date, []);
        }
        grouped.get(date)!.push(memory);
      } catch (error) {
        console.error(`[Daily Summaries] Error parsing date for memory ${memory.id}:`, error);
      }
    });

    console.log(`[Daily Summaries] Grouped into ${grouped.size} days`);

    // Generate summaries for each day using Gemini
    const summaries = [];
    
    for (const [date, dayMemories] of grouped.entries()) {
      try {
        // Create a comprehensive prompt for the day
        const memoryTexts = dayMemories.map(m => `- ${m.summary} (${m.kind})`).join('\n');
        const timeContext = new Date(dayMemories[0].startTime);
        
        const input = {
          timestamp: timeContext,
          timeOfDay: getTimeOfDay(timeContext),
          dayOfWeek: timeContext.toLocaleDateString('en-US', { weekday: 'long' }),
          userNote: `Generate a daily summary for ${date}. Memories captured:\n${memoryTexts}`,
        };

        const geminiResult = await analyzeMemoryWithGemini(input);
        
        if (geminiResult) {
          summaries.push({
            date,
            count: dayMemories.length,
            summary: geminiResult.summary || `You captured ${dayMemories.length} memory${dayMemories.length === 1 ? '' : 'ies'} today.`,
            description: geminiResult.description || '',
            highlights: dayMemories.slice(0, 3).map(m => m.summary),
            tags: geminiResult.tags || [],
            usedGemini: true,
          });
        } else {
          // Fallback to local summary
          summaries.push(generateLocalSummary(dayMemories, date));
        }
      } catch (error) {
        console.error(`[Daily Summaries] Error generating summary for ${date}:`, error);
        // Fallback to local summary
        summaries.push(generateLocalSummary(dayMemories, date));
      }
    }

    // Sort by date (newest first)
    summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`[Daily Summaries] ✅ Generated ${summaries.length} summaries`);

    res.json({
      summaries,
      totalDays: summaries.length,
      totalMemories: memories.length,
    });
  } catch (error) {
    console.error('[Daily Summaries] Error:', error);
    res.status(500).json({
      error: 'Failed to generate summaries',
      summaries: [],
    });
  }
});

/**
 * Generate local summary (fallback)
 */
function generateLocalSummary(dayMemories: MemoryInput[], date: string) {
  const voiceCount = dayMemories.filter(m => m.kind === 'emotional').length;
  const photoCount = dayMemories.filter(m => m.kind === 'photo').length;
  const placeCount = dayMemories.filter(m => m.kind === 'context').length;
  
  let summary = '';
  if (dayMemories.length === 1) {
    summary = `You captured 1 memory today.`;
  } else {
    summary = `You captured ${dayMemories.length} memories today`;
    const parts: string[] = [];
    if (voiceCount > 0) parts.push(`${voiceCount} voice note${voiceCount > 1 ? 's' : ''}`);
    if (photoCount > 0) parts.push(`${photoCount} photo${photoCount > 1 ? 's' : ''}`);
    if (placeCount > 0) parts.push(`${placeCount} place${placeCount > 1 ? 's' : ''}`);
    if (parts.length > 0) {
      summary += ': ' + parts.join(', ');
    }
  }
  
  return {
    date,
    count: dayMemories.length,
    summary,
    description: '',
    highlights: dayMemories.slice(0, 3).map(m => m.summary),
    tags: [],
    usedGemini: false,
  };
}

function getTimeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export default router;

