/**
 * Gemini Service - Uses Google Gemini Vision API for image analysis
 * 
 * Free tier: 15 requests per minute, 1500 requests per day
 * Get API key: https://aistudio.google.com/app/apikey
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

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
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Free tier model
    console.log('[Gemini] ✅ Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Gemini] Failed to initialize:', error);
    return false;
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



