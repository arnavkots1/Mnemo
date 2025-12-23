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
    
    // List all available models
    const models = await genAI.listModels();
    
    console.log('✅ Available Gemini Models:');
    console.log('========================');
    
    models.forEach((model: any) => {
      console.log(`- ${model.name}`);
      if (model.displayName) {
        console.log(`  Display Name: ${model.displayName}`);
      }
      if (model.supportedGenerationMethods) {
        console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
      console.log('');
    });
    
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

