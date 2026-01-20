/**
 * Gemini Memory Service - Analyzes DAILY MEMORIES (summaries of multiple moments)
 * 
 * THIS IS FOR DAILY MEMORIES ONLY - NOT INDIVIDUAL MOMENTS
 * 
 * Uses Gemini to create daily summaries from multiple moments:
 * - Aggregates moments from a single day
 * - Creates cohesive daily narratives
 * - Identifies patterns and themes
 * 
 * Rate limiting is shared with geminiMomentsService via geminiRateLimiter
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
    console.warn('[Gemini Memories] No API key found');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
    console.log('[Gemini Memories] ✅ Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Gemini Memories] Failed to initialize:', error);
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
        console.warn(`[Gemini Memories] ⚠️ Falling back to ${modelName}`);
      }
      const result = await activeModel.generateContent(promptParts);
      return { result, modelName };
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error)) {
        throw error;
      }
      console.warn(`[Gemini Memories] ⚠️ ${modelName} failed, trying next model`);
    }
  }

  throw lastError;
}

// Rate limiting is now handled by geminiRateLimiter.ts (shared across all Gemini services)

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
  // Check rate limit (shared across all Gemini services)
  const rateLimitCheck = checkRateLimit();
  if (!rateLimitCheck.allowed) {
    console.warn(`[Gemini Memories] ⚠️ ${rateLimitCheck.reason}`);
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
    let promptText = `You are a creative memory storyteller. Analyze the provided data and create a unique, engaging memory description that feels personal and meaningful.

**Your task:**
1. Create a brief, natural summary (3-8 words) - Be SPECIFIC and CREATIVE. Describe what you actually see/hear/feel, not generic labels
2. Write a detailed, engaging description (2-4 sentences) - Tell a story about this moment. Vary your language and structure. Avoid repetitive phrases.
3. Suggest 3-5 relevant tags that help categorize and find this memory
4. If analyzing voice/audio, determine the primary emotion (happy, sad, calm, excited, neutral, surprised)

**CRITICAL RULES:**
- NEVER use phrases like "A memorable moment captured", "Morning photo", "Photo taken with [camera]", or similar generic templates
- Vary your sentence structure - don't always start with "A" or "This"
- Be creative and descriptive - focus on WHAT is happening, WHO might be there, WHERE it is, WHY it matters
- If you see a photo, describe what's actually in it (people, objects, scenery, activities, mood, colors, setting)
- If you hear audio, describe what was said or the feeling conveyed, not just "voice note"
- Make each description unique - avoid copying the same structure or phrases
- Write naturally, as if telling a friend about this moment

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
        console.error('[Gemini Memories] Error reading photo:', error);
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
        console.log('[Gemini Memories] 🎤 Added audio file to request');
      } catch (error) {
        console.error('[Gemini Memories] Error reading audio:', error);
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
**Writing Style:**
- Write naturally and creatively - each description should feel unique
- Vary your sentence structure and word choice
- Focus on the story and meaning, not just listing facts
- If you see a photo: Describe the scene, people, objects, mood, colors, activities - what makes this moment special?
- If you hear audio: Describe the content, emotion, and meaning - what was being expressed?
- If user provided a note: Weave their words naturally into the description
- ${dataSources.length < 3 ? 'Work with limited data - be creative with what you have' : 'Use all available data to create a rich, multi-layered memory'}

**Response format (JSON only):**
{
  "summary": "creative brief summary describing what's actually happening (avoid generic phrases)",
  "description": "natural, varied description that tells a story about this moment (vary sentence structure, avoid templates)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "emotion": "happy|sad|calm|excited|neutral|surprised (if voice/audio data present, otherwise omit)"
}`;

    // Combine prompt text with any images
    if (promptParts.length > 0) {
      promptParts.unshift(promptText);
    } else {
      promptParts = [promptText];
    }

    // Call Gemini
    const { result, modelName } = await generateWithFallback(promptParts);
    const response = result.response;
    const text = response.text();
    if (modelName !== PRIMARY_MODEL) {
      console.log(`[Gemini Memories] ✅ Used fallback model: ${modelName}`);
    }

    // Parse response
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      const parsed = JSON.parse(jsonStr);

      // Record successful request
      recordRequest('memories');
      
      // Clean up and validate - ensure summary is not the prompt text
      let summary = (parsed.summary || 'Memory captured').trim();
      // Remove any prompt-like text
      if (summary.toLowerCase().includes('create a rich') || 
          summary.toLowerCase().includes('planning') ||
          summary.toLowerCase().includes('midday prompt')) {
        console.warn(`[Gemini Memories] ⚠️ Generic summary, using description instead`);
        summary = parsed.description?.substring(0, 50).trim() || 'Daily memory';
      }
      
      const result: MemoryAnalysisResult = {
        summary: summary.substring(0, 100),
        description: (parsed.description || 'A moment in time').substring(0, 500),
        tags: (parsed.tags || ['memory']).slice(0, 5),
        emotion: parsed.emotion || undefined,
        confidence: dataQuality === 'excellent' ? 0.95 : dataQuality === 'good' ? 0.85 : dataQuality === 'limited' ? 0.70 : 0.50,
        warnings,
        dataQuality,
        dataSources,
      };
      
      return result;
      
    } catch (parseError) {
      console.warn('[Gemini Memories] JSON parse error, extracting from text');
      
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
    console.error('[Gemini Memories] Error:', error);
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
      console.warn(`[Gemini Memories] Rate limit hit at item ${i + 1}/${inputs.length}`);
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

