/**
 * Gemini Moments Service - Analyzes individual MOMENTS (photos, audio, location entries)
 * 
 * THIS IS FOR MOMENTS ONLY - NOT DAILY MEMORIES (SUMMARIES)
 * 
 * Uses Gemini to intelligently analyze and describe individual moments from:
 * - Photos (visual content)
 * - Audio/Voice (emotion, content)
 * - Location (context)
 * - User notes
 * 
 * Rate limiting is shared with geminiMemoryService via geminiRateLimiter
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import { checkRateLimit, recordRequest } from './geminiRateLimiter';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-3-flash'];

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

/**
 * Initialize Gemini model
 */
function initializeGemini() {
  if (!GEMINI_API_KEY) {
    console.warn('[Gemini Moments] No API key found');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
    console.log('[Gemini Moments] ✅ Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Gemini Moments] Failed to initialize:', error);
    return false;
  }
}

function isRetryableGeminiError(error: any): boolean {
  const message = String(error?.message || '');
  const status = error?.status || error?.statusCode || error?.response?.status;
  return status === 503 || status === 429 || message.includes('503') || message.includes('overloaded');
}

async function generateWithFallback(promptParts: any[]): Promise<{ result: any; modelName: string }> {
  if (!genAI && !initializeGemini()) {
    throw new Error('Gemini not initialized');
  }
  const modelNames = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: any;

  for (const modelName of modelNames) {
    try {
      const activeModel = modelName === PRIMARY_MODEL && model
        ? model
        : genAI!.getGenerativeModel({ model: modelName });
      if (modelName !== PRIMARY_MODEL) {
        console.warn(`[Gemini Moments] ⚠️ Falling back to ${modelName}`);
      }
      const result = await activeModel.generateContent(promptParts);
      return { result, modelName };
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error)) {
        throw error;
      }
      console.warn(`[Gemini Moments] ⚠️ ${modelName} failed, trying next model`);
    }
  }

  throw lastError;
}

// Initialize on module load
initializeGemini();

/**
 * Input for moment analysis (individual entry)
 */
export interface MomentAnalysisInput {
  // Media
  photoPath?: string;
  audioPath?: string;
  
  // Context
  timestamp: Date;
  timeOfDay?: string;
  dayOfWeek?: string;
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
  };
  
  // User input
  userNote?: string;
  
  // Analysis hints
  audioEmotion?: string;
  audioTranscript?: string;
}

/**
 * Result from Gemini moment analysis
 */
export interface MomentAnalysisResult {
  summary: string;
  description: string;
  tags: string[];
  confidence: number;
  dataSources: string[];
  warnings?: string[];
  dataQuality?: 'excellent' | 'good' | 'limited' | 'minimal';
  emotion?: string;
  audioTranscript?: string;
}

/**
 * Analyze a single MOMENT using Gemini
 */
export async function analyzeMomentWithGemini(
  input: MomentAnalysisInput
): Promise<MomentAnalysisResult | null> {
  // Check rate limit (shared across all Gemini services)
  const rateLimitCheck = checkRateLimit();
  if (!rateLimitCheck.allowed) {
    console.warn(`[Gemini Moments] ⚠️ ${rateLimitCheck.reason}`);
    return null;
  }

  // Initialize if needed
  if (!model && !initializeGemini()) {
    return null;
  }

  if (!model) {
    return null;
  }

  try {
    const dataSources: string[] = [];
    const warnings: string[] = [];
    let dataQuality: 'excellent' | 'good' | 'limited' | 'minimal' = 'good';

    // Track what data we have
    if (input.photoPath) dataSources.push('photo');
    if (input.audioPath) dataSources.push('audio');
    if (input.audioTranscript) dataSources.push('audio-transcript');
    if (input.location) dataSources.push('location');
    if (input.userNote) dataSources.push('user-note');
    if (input.timeOfDay) dataSources.push('time-context');

    // Determine data quality
    if (dataSources.length >= 3) dataQuality = 'excellent';
    else if (dataSources.length === 2) dataQuality = 'good';
    else if (dataSources.length === 1) dataQuality = 'limited';
    else dataQuality = 'minimal';

    if (dataQuality === 'limited' || dataQuality === 'minimal') {
      warnings.push('Limited data available - description may be basic');
    }

    // Build MOMENT-SPECIFIC prompt
    let promptParts: any[] = [];
    let promptText = `You are analyzing a single MOMENT - an individual memory entry (photo, audio, or location check-in).

**Your task:**
1. Create a brief, creative title/summary (3-8 words) - Describe what's ACTUALLY happening in this moment
2. Write a natural description (1-3 sentences) - Focus on THIS specific moment, not general statements
3. Suggest 3-5 relevant tags
4. If analyzing voice/audio, determine emotion (happy, sad, calm, excited, neutral, surprised)

**CRITICAL RULES FOR MOMENTS:**
- Focus on SPECIFIC details of THIS moment - what's happening RIGHT NOW in the photo/audio/location
- If you see a photo: Describe the actual scene - people, objects, setting, activities, mood, colors
- If you hear audio: Describe what was said, the tone, the feeling conveyed
- If it's a location: Describe the place and what might be happening there
- NEVER use generic phrases like "A memorable moment captured", "Morning photo", "Photo taken with [camera]"
- NEVER mention camera models or technical details unless specifically relevant to the story
- Each moment should feel unique - vary your language and structure
- Write as if you're telling a friend about what you see/hear/experience in THIS moment

**Available data for this moment:**
`;

    // Add time context
    if (input.timestamp) {
      const date = input.timestamp.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      promptText += `- Date/Time: ${date}`;
      if (input.timeOfDay) {
        promptText += ` (${input.timeOfDay})`;
      }
      promptText += '\n';
    }

    // Add photo
    if (input.photoPath) {
      try {
        const imageData = fs.readFileSync(input.photoPath);
        const base64Image = imageData.toString('base64');
        const ext = input.photoPath.toLowerCase().split('.').pop();
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

        promptText += '- Photo: See attached image - describe what you ACTUALLY SEE\n';
        promptParts.push({
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        });
      } catch (error) {
        console.error('[Gemini Moments] Error reading photo:', error);
        warnings.push('Photo could not be analyzed');
      }
    }

    // Add audio
    if (input.audioPath) {
      try {
        const audioData = fs.readFileSync(input.audioPath);
        const base64Audio = audioData.toString('base64');
        const ext = input.audioPath.toLowerCase().split('.').pop();
        let mimeType = 'audio/m4a';
        if (ext === 'mp3') mimeType = 'audio/mp3';
        else if (ext === 'wav') mimeType = 'audio/wav';
        else if (ext === 'm4a') mimeType = 'audio/m4a';

        promptText += '- Audio: See attached audio - describe what you HEAR\n';
        promptParts.push({
          inlineData: {
            data: base64Audio,
            mimeType: mimeType,
          },
        });
      } catch (error) {
        console.error('[Gemini Moments] Error reading audio:', error);
        warnings.push('Audio could not be analyzed');
      }
    }

    // Add audio transcript
    if (input.audioTranscript) {
      promptText += `- Voice transcript: "${input.audioTranscript}"\n`;
    }

    // Add emotion hint
    if (input.audioEmotion) {
      promptText += `- Detected emotion: ${input.audioEmotion}\n`;
    }

    // Add location
    if (input.location?.placeName) {
      promptText += `- Location: ${input.location.placeName}\n`;
    } else if (input.location?.latitude && input.location?.longitude) {
      promptText += `- Coordinates: ${input.location.latitude}, ${input.location.longitude}\n`;
    }

    // Add user note
    if (input.userNote) {
      promptText += `- User's note: "${input.userNote}" (IMPORTANT: incorporate this)\n`;
    }

    // Final instructions
    promptText += `
**Remember:**
- Describe THIS SPECIFIC moment, not generic statements
- Focus on what you see/hear/experience in the data provided
- Be creative and varied - each moment is unique
- Write naturally, avoid templates and repetitive phrases

**Response format (JSON only):**
{
  "summary": "creative title describing what's actually happening (3-8 words)",
  "description": "natural description of this specific moment (1-3 sentences)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "emotion": "happy|sad|calm|excited|neutral|surprised (only if audio/voice present)"
}`;

    // Combine prompt
    if (promptParts.length > 0) {
      promptParts.unshift(promptText);
    } else {
      promptParts = [promptText];
    }

    // Call Gemini (with fallback models on overload)
    console.log('[Gemini Moments] 🚀 Analyzing moment...');
    const { result, modelName } = await generateWithFallback(promptParts);
    const response = result.response;
    const text = response.text();
    if (modelName !== PRIMARY_MODEL) {
      console.log(`[Gemini Moments] ✅ Used fallback model: ${modelName}`);
    }

    console.log('[Gemini Moments] 📝 Raw response:', text.substring(0, 200));

    // Parse JSON response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    const parsed = JSON.parse(jsonStr);

    // Record successful request
    recordRequest('moments');

    // Validate and return
    let summary = parsed.summary || 'Moment captured';
    const description = parsed.description || 'A moment in time.';

    // Ensure summary is not generic
    const genericPhrases = ['memorable moment', 'moment captured', 'memory created'];
    if (genericPhrases.some(phrase => summary.toLowerCase().includes(phrase))) {
      console.warn(`[Gemini Moments] ⚠️ Generic summary detected, using description instead`);
      summary = description.split('.')[0].substring(0, 50);
    }

    return {
      summary,
      description,
      tags: parsed.tags || [],
      confidence: 0.9,
      dataSources,
      warnings: warnings.length > 0 ? warnings : undefined,
      dataQuality,
      emotion: parsed.emotion,
      audioTranscript: input.audioTranscript,
    };
  } catch (error) {
    console.error('[Gemini Moments] Error analyzing moment:', error);
    return null;
  }
}

