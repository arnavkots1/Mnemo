/**
 * Memory Analysis Routes - Comprehensive memory generation using Gemini
 * 
 * POST /api/memory/analyze - Analyze and generate memory from multiple inputs
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeMemoryWithGemini } from '../services/geminiMemoryService';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

/**
 * POST /api/memory/analyze
 * 
 * Comprehensive memory analysis using Gemini AI
 * Accepts: photo, audio transcript, location, user notes
 * Returns: Intelligent memory description with warnings for limited data
 */
router.post(
  '/analyze',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const {
        audioTranscript,
        audioEmotion,
        locationName,
        latitude,
        longitude,
        userNote,
        timestamp,
        timeOfDay,
        dayOfWeek,
      } = req.body;

      // Parse timestamp
      const memoryTimestamp = timestamp ? new Date(timestamp) : new Date();

      // Prepare input for Gemini
      const input: any = {
        timestamp: memoryTimestamp,
        timeOfDay,
        dayOfWeek,
      };

      // Add photo if provided
      if (files?.photo && files.photo[0]) {
        input.photoPath = files.photo[0].path;
      }

      // Add audio data
      if (audioTranscript) {
        input.audioTranscript = audioTranscript;
      }
      if (audioEmotion) {
        input.audioEmotion = audioEmotion;
      }

      // Add location
      if (locationName || (latitude && longitude)) {
        input.location = {
          placeName: locationName,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
        };
      }

      // Add user note
      if (userNote) {
        input.userNote = userNote;
      }

      console.log('[Memory Analysis] Analyzing with data sources:', Object.keys(input).filter(k => input[k]));

      // Call Gemini for comprehensive analysis
      const result = await analyzeMemoryWithGemini(input);

      // Cleanup uploaded files
      if (files?.photo) {
        files.photo.forEach(file => {
          fs.unlink(file.path, () => {});
        });
      }
      if (files?.audio) {
        files.audio.forEach(file => {
          fs.unlink(file.path, () => {});
        });
      }

      if (!result) {
        // Fallback to basic analysis
        return res.json({
          summary: userNote || 'Memory captured',
          description: userNote ? `"${userNote}" - captured on ${memoryTimestamp.toLocaleDateString()}` : `A moment captured on ${memoryTimestamp.toLocaleDateString()}`,
          tags: ['memory'],
          emotion: audioEmotion || undefined,
          confidence: 0.4,
          warnings: ['Gemini AI unavailable - using basic analysis'],
          dataQuality: 'minimal',
          dataSources: Object.keys(input).filter(k => input[k] && k !== 'timestamp'),
          usedGemini: false,
        });
      }

      // Return Gemini analysis
      res.json({
        ...result,
        usedGemini: true,
      });
    } catch (error) {
      console.error('[Memory Analysis] Error:', error);
      res.status(500).json({
        error: 'Failed to analyze memory',
        summary: 'Memory captured',
        description: 'An error occurred during analysis',
        tags: ['memory'],
        confidence: 0.3,
        warnings: ['Analysis error - using fallback'],
        dataQuality: 'minimal',
        dataSources: [],
        usedGemini: false,
      });
    }
  }
);

/**
 * GET /api/memory/status
 * 
 * Check Gemini API status and rate limits
 */
router.get('/status', (req, res) => {
  res.json({
    geminiAvailable: !!process.env.GEMINI_API_KEY,
    rateLimit: {
      perMinute: 10,
      perDay: 1000,
    },
    status: 'operational',
  });
});

export default router;

