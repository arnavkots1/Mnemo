/**
 * Gemini Memory Service - Comprehensive memory analysis using Gemini AI
 * 
 * Uses Gemini to intelligently analyze and describe memories from:
 * - Photos (visual content)
 * - Audio/Voice (emotion, content)
 * - Location (context)
 * - User notes
 * 
 * Works with limited data and provides warnings when data is insufficient
 * 
 * RATE LIMITING (Free Tier):
 * - Model: gemini-2.5-flash
 * - RPM: 5 requests/minute (using 4/min with buffer)
 * - TPM: 250K tokens/minute (not tracked, but requests are small)
 * - Daily: Conservative limit of 500 requests/day
 * 
 * Rate limits are enforced before each API call. When exceeded, returns null
 * and falls back to local stub generation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

// Rate limiting - Free tier limits for gemini-2.5-flash:
// - RPM: 5 requests/minute
// - TPM: 250K tokens/minute (tracked separately)
// Using conservative limits with buffer to stay within free tier
const RATE_LIMIT_PER_MINUTE = 4; // Free tier: 5/min, using 4 to leave buffer
const RATE_LIMIT_PER_DAY = 500; // Conservative daily limit for free tier
const requestTimestamps: number[] = [];
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();

/**
 * Initialize Gemini model
 */
function initializeGemini() {
  if (!GEMINI_API_KEY) {
    console.warn('[Gemini Memory] No API key found');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-2.5-flash (available model from your API)
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('[Gemini Memory] ✅ Initialized successfully with gemini-2.5-flash');
    return true;
  } catch (error) {
    console.error('[Gemini Memory] Failed to initialize with gemini-2.5-flash:', error);
    return false;
  }
}

/**
 * Check rate limits
 */
function checkRateLimit(): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const currentDate = new Date().toDateString();
  
  if (currentDate !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = currentDate;
  }
  
  if (dailyRequestCount >= RATE_LIMIT_PER_DAY) {
    return { allowed: false, reason: `Daily limit reached (${RATE_LIMIT_PER_DAY}/day)` };
  }
  
  const oneMinuteAgo = now - 60000;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }
  
  if (requestTimestamps.length >= RATE_LIMIT_PER_MINUTE) {
    return { allowed: false, reason: `Rate limit (${RATE_LIMIT_PER_MINUTE}/min)` };
  }
  
  return { allowed: true };
}

/**
 * Record API request
 */
function recordRequest() {
  requestTimestamps.push(Date.now());
  dailyRequestCount++;
  const remainingToday = RATE_LIMIT_PER_DAY - dailyRequestCount;
  const remainingThisMin = RATE_LIMIT_PER_MINUTE - requestTimestamps.length;
  
  console.log(`[Gemini Memory] Request recorded: ${dailyRequestCount}/${RATE_LIMIT_PER_DAY} today (${remainingToday} remaining), ${requestTimestamps.length}/${RATE_LIMIT_PER_MINUTE} last min (${remainingThisMin} remaining)`);
  
  // Warn when approaching limits
  if (remainingToday < 50) {
    console.warn(`⚠️ [Gemini Memory] Low daily quota: ${remainingToday} requests remaining`);
  }
  if (remainingThisMin < 1) {
    console.warn(`⚠️ [Gemini Memory] Approaching per-minute limit: ${remainingThisMin} requests remaining this minute`);
  }
}

export interface MemoryAnalysisInput {
  // Data sources
  photoPath?: string;
  audioPath?: string; // Audio file path (for Gemini to process)
  audioTranscript?: string;
  audioEmotion?: string;
  location?: {
    placeName?: string;
    latitude?: number;
    longitude?: number;
  };
  userNote?: string;
  
  // Context
  timestamp: Date;
  timeOfDay?: string;
  dayOfWeek?: string;
}

export interface MemoryAnalysisResult {
  summary: string;
  description: string;
  tags: string[];
  emotion?: string;
  confidence: number;
  
  // Data quality warnings
  warnings: string[];
  dataQuality: 'excellent' | 'good' | 'limited' | 'minimal';
  dataSources: string[];
}

/**
 * Analyze memory comprehensively using Gemini
 * This is the PRIMARY method for all memory analysis
 */
export async function analyzeMemoryWithGemini(
  input: MemoryAnalysisInput
): Promise<MemoryAnalysisResult | null> {
  // Check rate limit BEFORE making API call
  const rateLimitCheck = checkRateLimit();
  if (!rateLimitCheck.allowed) {
    console.warn(`[Gemini Memory] ⚠️ Rate limit exceeded: ${rateLimitCheck.reason}`);
    console.warn(`[Gemini Memory] Free tier limits: ${RATE_LIMIT_PER_MINUTE}/min, ${RATE_LIMIT_PER_DAY}/day`);
    console.warn(`[Gemini Memory] Falling back to local stub generation`);
    return null; // Will fall back to local generation in route handler
  }
  
  // Initialize if needed
  if (!model && !initializeGemini()) {
    return null;
  }

  if (!model) {
    return null;
  }

  try {
    // Assess available data
    const dataSources: string[] = [];
    const warnings: string[] = [];
    
    if (input.photoPath) dataSources.push('photo');
    if (input.audioPath) dataSources.push('audio-file');
    if (input.audioTranscript) dataSources.push('audio-transcript');
    if (input.audioEmotion) dataSources.push('emotion');
    if (input.location?.placeName) dataSources.push('location');
    if (input.userNote) dataSources.push('user-note');
    
    // Determine data quality
    let dataQuality: 'excellent' | 'good' | 'limited' | 'minimal' = 'minimal';
    if (dataSources.length >= 4) {
      dataQuality = 'excellent';
    } else if (dataSources.length === 3) {
      dataQuality = 'good';
    } else if (dataSources.length === 2) {
      dataQuality = 'limited';
      warnings.push('Limited data available - analysis may be less accurate');
    } else if (dataSources.length === 1) {
      dataQuality = 'minimal';
      warnings.push('Very limited data - memory description is basic');
    } else {
      warnings.push('No data provided - using timestamp only');
    }
    
    // Build comprehensive prompt
    let promptParts: any[] = [];
    let promptText = `You are an intelligent memory assistant. Analyze the provided data and create a rich, meaningful memory description.

**Your task:**
1. Create a brief, natural summary (3-8 words) - NOT generic, be SPECIFIC and DESCRIPTIVE based on the actual content
2. Write a detailed, engaging description (2-4 sentences) that captures the moment with context and meaning
3. Suggest 3-5 relevant tags that help categorize and find this memory
4. If analyzing voice/audio, determine the primary emotion (happy, sad, calm, excited, neutral, surprised)

**IMPORTANT:** 
- Be creative and descriptive even with limited data
- Avoid generic phrases like "neutral moment captured" or "memory created"
- Use the available context (time, location, notes) to create something meaningful
- If data is limited, acknowledge it but still create the best description possible
- Make it feel personal and specific, not robotic

**Available data:**
`;

    // Add context
    if (input.timestamp) {
      const date = input.timestamp.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      promptText += `- Date/Time: ${date}`;
      if (input.timeOfDay) {
        promptText += ` (${input.timeOfDay})`;
      }
      promptText += '\n';
    }
    
    // Add photo if available
    if (input.photoPath) {
      try {
        const imageData = fs.readFileSync(input.photoPath);
        const base64Image = imageData.toString('base64');
        const ext = input.photoPath.toLowerCase().split('.').pop();
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        
        promptText += '- Photo: Attached image\n';
        promptParts.push({
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        });
      } catch (error) {
        console.error('[Gemini Memory] Error reading photo:', error);
        warnings.push('Photo could not be analyzed');
      }
    }
    
    // Add audio file if available (Gemini can process audio directly)
    if (input.audioPath) {
      try {
        const audioData = fs.readFileSync(input.audioPath);
        const base64Audio = audioData.toString('base64');
        const ext = input.audioPath.toLowerCase().split('.').pop();
        let mimeType = 'audio/m4a';
        if (ext === 'mp3') mimeType = 'audio/mp3';
        else if (ext === 'wav') mimeType = 'audio/wav';
        else if (ext === 'm4a') mimeType = 'audio/m4a';
        
        promptText += '- Audio: Attached audio file\n';
        promptParts.push({
          inlineData: {
            data: base64Audio,
            mimeType: mimeType,
          },
        });
        console.log('[Gemini Memory] 🎤 Added audio file to Gemini request');
      } catch (error) {
        console.error('[Gemini Memory] Error reading audio:', error);
        warnings.push('Audio file could not be analyzed');
      }
    }
    
    // Add audio/voice data (transcript/emotion from frontend analysis)
    if (input.audioTranscript) {
      promptText += `- Voice transcript: "${input.audioTranscript}"\n`;
    }
    if (input.audioEmotion) {
      promptText += `- Detected emotion from voice: ${input.audioEmotion}\n`;
    }
    
    // Add location
    if (input.location?.placeName) {
      promptText += `- Location: ${input.location.placeName}\n`;
    } else if (input.location?.latitude && input.location?.longitude) {
      promptText += `- Coordinates: ${input.location.latitude}, ${input.location.longitude}\n`;
    }
    
    // Add user note (highest priority)
    if (input.userNote) {
      promptText += `- User's note: "${input.userNote}" (IMPORTANT: incorporate this into the summary/description)\n`;
    }
    
    // Add instructions
    promptText += `
**Instructions:**
- Be specific and descriptive, not generic
- If user provided a note, prioritize their words in the summary
- Combine all available data into a cohesive description
- Tags should be relevant and useful for searching
- ${dataSources.length < 3 ? 'Work with limited data - be honest about what you can determine' : 'Use all available data to create a rich memory'}

**Response format (JSON only):**
{
  "summary": "specific brief summary (not generic)",
  "description": "detailed engaging description combining all data",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "emotion": "happy|sad|calm|excited|neutral|surprised (if voice/audio data present, otherwise omit)",
  "reasoning": "brief explanation of your analysis (optional)"
}`;

    // Combine prompt text with any images
    if (promptParts.length > 0) {
      promptParts.unshift(promptText);
    } else {
      promptParts = [promptText];
    }

    // Call Gemini
    console.log('[Gemini Memory] Analyzing memory with', dataSources.length, 'data sources:', dataSources.join(', '));
    const result = await model.generateContent(promptParts);
    const response = result.response;
    const text = response.text();

    // Parse response
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      const parsed = JSON.parse(jsonStr);

      // Record successful request
      recordRequest();
      
      // Clean up and validate
      const result: MemoryAnalysisResult = {
        summary: (parsed.summary || 'Memory captured').substring(0, 100),
        description: (parsed.description || 'A moment in time').substring(0, 500),
        tags: (parsed.tags || ['memory']).slice(0, 5),
        emotion: parsed.emotion || undefined,
        confidence: dataQuality === 'excellent' ? 0.95 : dataQuality === 'good' ? 0.85 : dataQuality === 'limited' ? 0.70 : 0.50,
        warnings,
        dataQuality,
        dataSources,
      };
      
      console.log(`[Gemini Memory] ✅ Analysis complete (${dataQuality} quality, ${dataSources.length} sources)`);
      return result;
      
    } catch (parseError) {
      console.warn('[Gemini Memory] JSON parse error, extracting from text');
      
      // Fallback parsing
      const lines = text.split('\n').filter((l: string) => l.trim());
      const summary = lines[0]?.replace(/^[0-9]+\.\s*/, '').trim() || 'Memory captured';
      const description = lines.slice(0, 3).join(' ').trim() || text.substring(0, 200);
      
      recordRequest();
      
      return {
        summary: summary.substring(0, 100),
        description: description.substring(0, 500),
        tags: ['memory', 'ai-generated'],
        confidence: 0.6,
        warnings: [...warnings, 'AI response parsing error - using extracted text'],
        dataQuality,
        dataSources,
      };
    }
  } catch (error) {
    console.error('[Gemini Memory] Error:', error);
    return null;
  }
}

/**
 * Batch analyze multiple memories (with rate limit respect)
 */
export async function batchAnalyzeMemories(
  inputs: MemoryAnalysisInput[]
): Promise<(MemoryAnalysisResult | null)[]> {
  const results: (MemoryAnalysisResult | null)[] = [];
  
  // Process in small batches to respect rate limits
  for (let i = 0; i < inputs.length; i++) {
    const rateLimitCheck = checkRateLimit();
    
    if (!rateLimitCheck.allowed) {
      console.warn(`[Gemini Memory] Rate limit hit at item ${i + 1}/${inputs.length}`);
      // Return null for remaining items
      results.push(...Array(inputs.length - i).fill(null));
      break;
    }
    
    const result = await analyzeMemoryWithGemini(inputs[i]);
    results.push(result);
    
    // Small delay between requests
    if (i < inputs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Initialize on load
initializeGemini();

