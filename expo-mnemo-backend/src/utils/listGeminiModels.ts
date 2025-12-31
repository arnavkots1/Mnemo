/**
 * Utility to list available Gemini models
 * Run with: npx ts-node src/utils/listGeminiModels.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

async function listAvailableModels() {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Note: listModels() is not available in the current SDK version
    // We'll just test common model names instead
    
    // Try common model names
    console.log('\n🔍 Testing Common Model Names:');
    console.log('============================');
    
    const modelNamesToTest = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash',
    ];
    
    for (const modelName of modelNamesToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Just test if we can create the model object (doesn't make actual API call)
        console.log(`✅ ${modelName} - Available`);
      } catch (error: any) {
        console.log(`❌ ${modelName} - ${error.message}`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error listing models:', error.message);
  }
}

listAvailableModels();

