/**
 * Audio Transcription Service
 * 
 * Uses Gemini AI to transcribe audio files to text for better memory analysis accuracy
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.5-flash-lite', 'gemini-3-flash'];

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

/**
 * Initialize Gemini model for transcription
 */
function initializeGemini() {
  if (!GEMINI_API_KEY) {
    console.warn('[Audio Transcription] No API key found');
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
    console.log('[Audio Transcription] ✅ Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Audio Transcription] Failed to initialize:', error);
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
        console.warn(`[Audio Transcription] ⚠️ Falling back to ${modelName}`);
      }
      const result = await activeModel.generateContent(promptParts);
      return { result, modelName };
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error)) {
        throw error;
      }
      console.warn(`[Audio Transcription] ⚠️ ${modelName} failed, trying next model`);
    }
  }

  throw lastError;
}

/**
 * Transcribe audio file to text using Gemini
 * 
 * @param audioPath - Path to audio file
 * @returns Transcript text or null if transcription fails
 */
export async function transcribeAudio(audioPath: string): Promise<string | null> {
  // Initialize if needed
  if (!model && !initializeGemini()) {
    return null;
  }

  if (!model) {
    return null;
  }

  try {
    // Read audio file
    const audioData = fs.readFileSync(audioPath);
    const base64Audio = audioData.toString('base64');
    const ext = audioPath.toLowerCase().split('.').pop();
    let mimeType = 'audio/m4a';
    if (ext === 'mp3') mimeType = 'audio/mp3';
    else if (ext === 'wav') mimeType = 'audio/wav';
    else if (ext === 'm4a') mimeType = 'audio/m4a';

    // Create prompt for transcription
    const prompt = `Please transcribe the audio file to text. Return only the transcribed text, without any additional commentary or formatting. If the audio is unclear or contains no speech, return "Unable to transcribe audio".`;

    // Call Gemini (with fallback models on overload)
    const { result, modelName } = await generateWithFallback([
      prompt,
      {
        inlineData: {
          data: base64Audio,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response;
    const transcript = response.text().trim();
    if (modelName !== PRIMARY_MODEL) {
      console.log(`[Audio Transcription] ✅ Used fallback model: ${modelName}`);
    }

    // Validate transcript
    if (!transcript || transcript.toLowerCase().includes('unable to transcribe')) {
      console.warn('[Audio Transcription] ⚠️ Transcription failed or returned empty');
      return null;
    }

    console.log(`[Audio Transcription] ✅ Transcribed: "${transcript.substring(0, 100)}${transcript.length > 100 ? '...' : ''}"`);
    return transcript;
  } catch (error) {
    console.error('[Audio Transcription] Error:', error);
    return null;
  }
}

// Initialize on load
initializeGemini();

