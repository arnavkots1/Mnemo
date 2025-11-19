/**
 * Image Analysis Routes
 * 
 * Analyzes images using file upload and generates memory summaries.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

interface AnalyzeImageRequest {
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
  };
  timeOfDay?: string;
  dayOfWeek?: string;
}

interface AnalyzeImageResponse {
  summary: string;
  description: string;
  tags?: string[];
  confidence: number;
}

/**
 * POST /api/analyze-image-upload
 * 
 * Uploads image file and analyzes it.
 */
router.post('/analyze-image-upload', upload.single('image'), async (req: Request, res: Response) => {
  let tempFilePath: string | undefined;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    tempFilePath = req.file.path;
    const { location, timeOfDay, dayOfWeek }: AnalyzeImageRequest = JSON.parse(req.body.metadata || '{}');
    
    console.log(`[Image API] Received image upload:`);
    console.log(`  - File: ${req.file.originalname} (${req.file.size} bytes)`);
    console.log(`  - timeOfDay: ${timeOfDay}`);
    console.log(`  - dayOfWeek: ${dayOfWeek}`);
    console.log(`  - location: ${location ? `${location.latitude}, ${location.longitude}` : 'none'}`);
    
    // TODO: Here you would:
    // 1. Load image from tempFilePath
    // 2. Run vision model (GPT-4 Vision, CLIP, etc.)
    // 3. Generate description based on actual image content
    // For now, using context-aware stub
    
    const parts: string[] = [];
    
    // Use the timeOfDay from photo's EXIF (not current time)
    if (timeOfDay) {
      const timeLabels: { [key: string]: string } = {
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening',
        night: 'Night',
      };
      const label = timeLabels[timeOfDay.toLowerCase()] || timeOfDay;
      parts.push(label);
    }
    
    if (location?.placeName) {
      parts.push(`at ${location.placeName}`);
    } else if (location) {
      parts.push('with location');
    }
    
    const descriptions = [
      'A memorable moment captured',
      'A special moment in time',
      'An important memory',
      'A beautiful scene',
      'A meaningful experience',
    ];
    
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    let summary = parts.length > 0 
      ? `${parts.join(' ')} photo` 
      : 'Photo moment';
    
    if (dayOfWeek && (dayOfWeek.toLowerCase() === 'saturday' || dayOfWeek.toLowerCase() === 'sunday')) {
      summary = `${dayOfWeek} ${summary}`;
    }
    
    const tagOptions = ['photo', 'memory', 'moment'];
    if (location) tagOptions.push('location');
    if (timeOfDay) tagOptions.push(timeOfDay);
    const tags = tagOptions.slice(0, 3);
    
    const confidence = 0.7 + Math.random() * 0.25;
    
    const response: AnalyzeImageResponse = {
      summary,
      description: `${randomDescription}. ${summary}`,
      tags,
      confidence: Math.round(confidence * 100) / 100,
    };
    
    console.log(`[Image API] Analyzed: ${summary} (confidence: ${confidence.toFixed(2)})`);
    
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    res.json(response);
  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    console.error('Error analyzing image:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/analyze-image (legacy - for backward compatibility)
 */
router.post('/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageUrl, imageUri, location, timeOfDay, dayOfWeek }: any = req.body;
    
    console.log(`[Image API] Legacy endpoint called - use /analyze-image-upload for file upload`);
    console.log(`  - timeOfDay: ${timeOfDay}`);
    
    const parts: string[] = [];
    
    if (timeOfDay) {
      const timeLabels: { [key: string]: string } = {
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening',
        night: 'Night',
      };
      parts.push(timeLabels[timeOfDay.toLowerCase()] || timeOfDay);
    }
    
    if (location?.placeName) {
      parts.push(`at ${location.placeName}`);
    }
    
    const summary = parts.length > 0 ? `${parts.join(' ')} photo` : 'Photo moment';
    
    res.json({
      summary,
      description: `A memorable moment captured. ${summary}`,
      tags: ['photo'],
      confidence: 0.7,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as imageRouter };
