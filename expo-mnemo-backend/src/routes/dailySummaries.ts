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
    // Reduced logging - only log essential info
    
    const { memories, targetDate } = req.body as { memories: MemoryInput[]; targetDate?: string };
    
    if (!memories || !Array.isArray(memories) || memories.length === 0) {
      console.warn(`⚠️ [Daily Summaries] No memories provided in request`);
      return res.status(400).json({
        error: 'No memories provided',
        summaries: [],
      });
    }

    // If targetDate is provided, filter memories to only that day
    let filteredMemories = memories;
    if (targetDate) {
      console.log(`📅 [Daily Summaries] Target date specified: ${targetDate}`);
      filteredMemories = memories.filter(memory => {
        try {
          const memoryDate = new Date(memory.startTime).toDateString();
          return memoryDate === targetDate;
        } catch (error) {
          console.error(`[Daily Summaries] Error parsing date for memory ${memory.id}:`, error);
          return false;
        }
      });
      
      if (filteredMemories.length === 0) {
        console.warn(`⚠️ [Daily Summaries] No memories found for target date: ${targetDate}`);
        return res.json({
          summaries: [],
          totalDays: 0,
          totalMemories: 0,
        });
      }
      
      console.log(`✅ [Daily Summaries] Filtered to ${filteredMemories.length} moment${filteredMemories.length === 1 ? '' : 's'} for ${targetDate}`);
    }

    // Group memories by day (should only be 1 day if targetDate is provided)
    const grouped = new Map<string, MemoryInput[]>();
    
    filteredMemories.forEach(memory => {
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

    // Should only be 1 day if targetDate was provided
    if (targetDate && grouped.size > 1) {
      console.warn(`⚠️ [Daily Summaries] Multiple days found when targetDate was specified. Using only ${targetDate}`);
      // Keep only the target date
      const targetDayMemories = grouped.get(targetDate);
      grouped.clear();
      if (targetDayMemories) {
        grouped.set(targetDate, targetDayMemories);
      }
    }

    // Generate summaries for each day using Gemini (should only be 1 day)
    const summaries = [];
    
    for (const [date, dayMemories] of grouped.entries()) {
      try {
        // Create a comprehensive prompt for the day with ALL available data
        const memoryDetails = dayMemories.map(m => {
          let detail = `- ${m.summary}`;
          if (m.kind) detail += ` (${m.kind})`;
          if (m.details?.description) detail += `\n  Description: ${m.details.description}`;
          if (m.details?.location) detail += `\n  Location: ${m.details.location}`;
          if (m.details?.emotion) detail += `\n  Emotion: ${m.details.emotion}`;
          if (m.details?.tags && m.details.tags.length > 0) detail += `\n  Tags: ${m.details.tags.join(', ')}`;
          const time = new Date(m.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          detail += `\n  Time: ${time}`;
          return detail;
        }).join('\n\n');
        
        const timeContext = new Date(dayMemories[0].startTime);
        const dateFormatted = timeContext.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        
        const input = {
          timestamp: timeContext,
          timeOfDay: getTimeOfDay(timeContext),
          dayOfWeek: timeContext.toLocaleDateString('en-US', { weekday: 'long' }),
          userNote: `Create a rich, engaging daily summary for ${dateFormatted} (${date}). 

You have ${dayMemories.length} moment${dayMemories.length === 1 ? '' : 's'} captured on this day. Analyze ALL the details below and create a comprehensive summary that:
1. Captures the overall theme or mood of the day
2. Highlights the most significant moments
3. Provides context about what happened
4. Makes it feel personal and meaningful

**Moments captured on this day:**
${memoryDetails}

**Your task:**
- Write a brief, natural summary (5-12 words) that captures the essence of the day
- Write a detailed description (3-5 sentences) that weaves together all the moments into a cohesive narrative
- Be specific and descriptive - avoid generic phrases like "neutral moment captured"
- If the data is limited, acknowledge it but still create the best summary possible with what's available
- Make it feel like a meaningful reflection of the day, not just a list of events`,
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
            warnings: geminiResult.warnings || [], // Include warnings
            dataQuality: geminiResult.dataQuality || 'limited', // Include data quality
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

    // Ensure only 1 summary is returned (for the target date)
    const finalSummaries = targetDate ? summaries.filter(s => s.date === targetDate).slice(0, 1) : summaries;

    console.log(`✅ [Daily Summaries] Generated ${finalSummaries.length} daily summar${finalSummaries.length === 1 ? 'y' : 'ies'}${targetDate ? ` for ${targetDate}` : ''}`);

    res.json({
      summaries: finalSummaries,
      totalDays: finalSummaries.length,
      totalMemories: filteredMemories.length,
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

