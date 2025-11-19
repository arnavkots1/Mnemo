/**
 * Model Loader Service
 * 
 * Automatically loads the ML model when backend starts.
 * This ensures the model is ready when API requests come in.
 */

import * as path from 'path';
import * as fs from 'fs';

let modelLoaded = false;
let modelPath: string | null = null;

/**
 * Initialize and load the ML model on backend startup
 */
export function initializeModel(): void {
  try {
    const modelDir = path.join(__dirname, '../../ml_model/saved_model');
    const modelFile = path.join(modelDir, 'emotion_model.h5');
    
    if (fs.existsSync(modelFile)) {
      modelPath = modelFile;
      modelLoaded = true;
      console.log('✅ ML Model found and ready:', modelFile);
      console.log('   Model will be used for emotion classification');
    } else {
      modelLoaded = false;
      console.log('⚠️  ML Model not found:', modelFile);
      console.log('   Using stub classifier (run train_emotion_model.py to train model)');
    }
  } catch (error) {
    console.error('❌ Error checking for ML model:', error);
    modelLoaded = false;
  }
}

/**
 * Check if model is loaded and available
 */
export function isModelLoaded(): boolean {
  return modelLoaded;
}

/**
 * Get the model path if available
 */
export function getModelPath(): string | null {
  return modelPath;
}

