/**
 * Emotion Classification Routes
 * 
 * Uses trained ML model for emotion classification (if available),
 * falls back to stub implementation if model not found.
 */

import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import { isModelLoaded } from '../services/modelLoader';

const execAsync = promisify(exec);

const router = Router();

// Configure multer for audio file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export type Emotion = 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral';

interface ClassifyEmotionRequest {
  audioUrl?: string;  // URL where audio clip is stored (for production)
  audioUri?: string;   // Local file URI (for development)
  fakeId?: string;    // For development/testing
}

interface ClassifyEmotionResponse {
  emotion: Emotion;
  confidence: number;
}

/**
 * Check if ML model is available
 * Uses the model loader service to check if model was loaded on startup
 */
async function isModelAvailable(): Promise<boolean> {
  return isModelLoaded();
}

/**
 * Classify emotion using Python ML model
 * 
 * Note: audioPath must be accessible from the backend server.
 * For mobile devices, you'll need to upload the file first or use a shared storage.
 */
async function classifyWithModel(audioPath: string): Promise<EmotionResult | null> {
  try {
    // Check if file exists and is accessible
    if (!fs.existsSync(audioPath)) {
      console.log(`Audio file not accessible: ${audioPath}`);
      return null;
    }
    
    const scriptPath = path.join(__dirname, '../../ml_model/classify_audio.py');
    const command = `python "${scriptPath}" "${audioPath}"`;
    
    const { stdout } = await execAsync(command);
    const result = JSON.parse(stdout);
    
    if (result.error) {
      console.error('Model classification error:', result.error);
      return null;
    }
    
    return {
      emotion: result.emotion as Emotion,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error('Error classifying with model:', error);
    return null;
  }
}

/**
 * Stub classification (fallback)
 */
function stubClassify(): EmotionResult {
  const emotions: Emotion[] = ['happy', 'sad', 'angry', 'surprised', 'neutral'];
  const isHappy = Math.random() < 0.7;
  const emotion: Emotion = isHappy 
    ? 'happy' 
    : emotions[Math.floor(Math.random() * emotions.length)];
  const confidence = 0.6 + Math.random() * 0.35;
  
  return { emotion, confidence };
}

interface EmotionResult {
  emotion: Emotion;
  confidence: number;
}

/**
 * POST /api/classify-emotion-upload
 * 
 * Uploads audio file and classifies emotion using ML model.
 */
router.post('/classify-emotion-upload', upload.single('audio'), async (req: Request, res: Response) => {
  let tempFilePath: string | undefined;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    tempFilePath = req.file.path;
    const modelAvailable = await isModelAvailable();
    
    let result: EmotionResult;
    
    if (modelAvailable) {
      // Use ML model
      const modelResult = await classifyWithModel(tempFilePath);
      if (modelResult) {
        result = modelResult;
        console.log(`[Emotion API] Model classified: ${result.emotion} (confidence: ${result.confidence.toFixed(2)})`);
      } else {
        result = stubClassify();
        console.log(`[Emotion API] Model failed, using stub: ${result.emotion}`);
      }
    } else {
      result = stubClassify();
      console.log(`[Emotion API] Model not available, using stub: ${result.emotion}`);
    }
    
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    res.json({
      emotion: result.emotion,
      confidence: Math.round(result.confidence * 100) / 100,
    });
  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    console.error('Error classifying emotion:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/classify-emotion
 * 
 * Classifies emotion from audio (legacy endpoint).
 * 
 * Request body:
 *   - audioUrl: string (optional) - URL to audio file
 *   - audioUri: string (optional) - Local file URI
 *   - fakeId: string (optional) - For dev/testing
 * 
 * Response:
 *   - emotion: Emotion type
 *   - confidence: number (0.0 to 1.0)
 */
router.post('/classify-emotion', async (req: Request, res: Response) => {
  try {
    const { audioUrl, audioUri, fakeId }: ClassifyEmotionRequest = req.body;
    
    // Validate request
    if (!audioUrl && !audioUri && !fakeId) {
      return res.status(400).json({
        error: 'Either audioUrl, audioUri, or fakeId must be provided',
      });
    }
    
    let result: EmotionResult;
    
    // Try to use ML model if available
    const modelAvailable = await isModelAvailable();
    
    // Note: audioUri from mobile device is a local path that backend can't access directly
    // For production, you'd need to upload the file first or use shared storage
    // For now, we'll use stub if audioUri is provided (it's a mobile local path)
    const isMobileLocalPath = audioUri && (
      audioUri.startsWith('file://') || 
      audioUri.startsWith('/var/mobile/') ||
      audioUri.includes('Documents/audio/')
    );
    
    if (modelAvailable && audioUri && !isMobileLocalPath) {
      // Try to classify with model (only if file is accessible from backend)
      const modelResult = await classifyWithModel(audioUri);
      if (modelResult) {
        result = modelResult;
        console.log(`[Emotion API] Model classified: ${result.emotion} (confidence: ${result.confidence.toFixed(2)})`);
      } else {
        // Fallback to stub
        result = stubClassify();
        console.log(`[Emotion API] Model failed, using stub: ${result.emotion}`);
      }
    } else {
      // Use stub implementation
      result = stubClassify();
      if (!modelAvailable) {
        console.log(`[Emotion API] Model not available, using stub: ${result.emotion}`);
      } else if (isMobileLocalPath) {
        console.log(`[Emotion API] Mobile local path provided, using stub (file upload needed for ML): ${result.emotion}`);
      }
    }
    
    // Simulate processing delay (50-200ms)
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
    
    const response: ClassifyEmotionResponse = {
      emotion: result.emotion,
      confidence: Math.round(result.confidence * 100) / 100, // Round to 2 decimals
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error classifying emotion:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as emotionRouter };
