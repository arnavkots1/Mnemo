/**
 * Gemini Service - Uses Google Gemini Vision API for image analysis
 * 
 * RATE LIMITING (Free Tier):
 * - Model: gemini-2.5-flash
 * - RPM: 5 requests/minute (using 4/min with buffer)
 * - TPM: 250K tokens/minute (not tracked, but requests are small)
 * - Daily: Conservative limit of 500 requests/day
 * 
 * Get API key: https://aistudio.google.com/app/apikey
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
  // Debug: Log if env var is loaded (but not the actual key)
  const hasKey = !!GEMINI_API_KEY;
  console.log(`[Gemini] API key loaded: ${hasKey ? 'YES' : 'NO'}`);
  if (hasKey) {
    console.log(`[Gemini] API key length: ${GEMINI_API_KEY.length} characters`);
  }
  
  if (!GEMINI_API_KEY) {
    console.warn('[Gemini] No API key found. Set GEMINI_API_KEY environment variable to enable image analysis.');
    console.warn('[Gemini] Create a .env file in expo-mnemo-backend/ with: GEMINI_API_KEY=your-key-here');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-2.5-flash (available model from your API)
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('[Gemini] ✅ Initialized successfully with gemini-2.5-flash');
    return true;
  } catch (error) {
    console.error('[Gemini] Failed to initialize with gemini-2.5-flash:', error);
    return false;
  }
}

/**
 * Check if we're within rate limits
 */
function checkRateLimit(): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const currentDate = new Date().toDateString();
  
  // Reset daily counter if it's a new day
  if (currentDate !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = currentDate;
    console.log('[Gemini] Daily rate limit reset');
  }
  
  // Check daily limit
  if (dailyRequestCount >= RATE_LIMIT_PER_DAY) {
    return {
      allowed: false,
      reason: `Daily limit reached (${RATE_LIMIT_PER_DAY} requests per day)`,
    };
  }
  
  // Remove timestamps older than 1 minute
  const oneMinuteAgo = now - 60000;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }
  
  // Check per-minute limit
  if (requestTimestamps.length >= RATE_LIMIT_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Rate limit reached (${RATE_LIMIT_PER_MINUTE} requests per minute)`,
    };
  }
  
  return { allowed: true };
}

/**
 * Record a successful API request
 */
function recordRequest() {
  requestTimestamps.push(Date.now());
  dailyRequestCount++;
  const remainingToday = RATE_LIMIT_PER_DAY - dailyRequestCount;
  const remainingThisMin = RATE_LIMIT_PER_MINUTE - requestTimestamps.length;
  
  console.log(`[Gemini] Request recorded: ${dailyRequestCount}/${RATE_LIMIT_PER_DAY} today (${remainingToday} remaining), ${requestTimestamps.length}/${RATE_LIMIT_PER_MINUTE} last min (${remainingThisMin} remaining)`);
  
  // Warn when approaching limits
  if (remainingToday < 50) {
    console.warn(`⚠️ [Gemini] Low daily quota: ${remainingToday} requests remaining`);
  }
  if (remainingThisMin < 1) {
    console.warn(`⚠️ [Gemini] Approaching per-minute limit: ${remainingThisMin} requests remaining this minute`);
  }
}

/**
 * Analyze image using Gemini Vision API
 */
export async function analyzeImageWithGemini(
  imagePath: string,
  context?: {
    timeOfDay?: string;
    dayOfWeek?: string;
    location?: string;
  }
): Promise<{
  summary: string;
  description: string;
  tags: string[];
  confidence: number;
} | null> {
  // Check rate limit BEFORE making API call
  const rateLimitCheck = checkRateLimit();
  if (!rateLimitCheck.allowed) {
    console.warn(`[Gemini] ⚠️ Rate limit exceeded: ${rateLimitCheck.reason}`);
    console.warn(`[Gemini] Free tier limits: ${RATE_LIMIT_PER_MINUTE}/min, ${RATE_LIMIT_PER_DAY}/day`);
    console.warn(`[Gemini] Falling back to local stub generation`);
    return null; // Will fall back to stub in the route handler
  }
  
  // Initialize if not already done
  if (!model && !initializeGemini()) {
    return null;
  }

  if (!model) {
    return null;
  }

  try {
    // Read image file
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');

    // Determine image type
    const ext = imagePath.toLowerCase().split('.').pop();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    // Build context prompt
    let contextPrompt = '';
    if (context?.timeOfDay) {
      contextPrompt += `The photo was taken during ${context.timeOfDay}. `;
    }
    if (context?.dayOfWeek) {
      contextPrompt += `It was taken on a ${context.dayOfWeek}. `;
    }
    if (context?.location) {
      contextPrompt += `Location: ${context.location}. `;
    }

    // Create prompt for Gemini
    const prompt = `Analyze this photo and provide:
1. A brief summary (2-5 words) describing what's in the photo
2. A detailed description (1-2 sentences) of the scene, objects, people, or activities visible
3. Relevant tags (3-5 words) that describe the photo

${contextPrompt}

Format your response as JSON:
{
  "summary": "brief summary here",
  "description": "detailed description here",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    // Call Gemini API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Try to parse JSON from response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      const parsed = JSON.parse(jsonStr);

      // Record successful request
      recordRequest();
      
      return {
        summary: parsed.summary || 'Photo moment',
        description: parsed.description || 'A memorable moment captured',
        tags: parsed.tags || ['photo', 'memory'],
        confidence: 0.9, // Gemini is quite accurate
      };
    } catch (parseError) {
      // If JSON parsing fails, extract summary from text
      console.warn('[Gemini] Failed to parse JSON, extracting from text:', parseError);
      
      // Try to extract summary (first line or first sentence)
      const lines = text.split('\n').filter((l: string) => l.trim());
      const summary = lines[0]?.replace(/^[0-9]+\.\s*/, '').trim() || 'Photo moment';
      const description = lines.slice(0, 3).join(' ').trim() || text.substring(0, 200);

      // Record successful request (even if parsing failed)
      recordRequest();

      return {
        summary: summary.substring(0, 50), // Limit length
        description: description.substring(0, 300),
        tags: ['photo', 'memory', 'ai-generated'],
        confidence: 0.8,
      };
    }
  } catch (error) {
    console.error('[Gemini] Error analyzing image:', error);
    return null;
  }
}

// Initialize on module load
initializeGemini();



