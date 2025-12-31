/**
 * Moment Analysis Routes - Analyzes individual MOMENTS using Gemini
 * 
 * POST /api/memory/analyze - Analyze and generate moment from multiple inputs
 * (Note: endpoint name kept as /memory/analyze for backward compatibility)
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeMomentWithGemini } from '../services/geminiMomentsService';
import { transcribeAudio } from '../services/audioTranscriptionService';

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
 * Comprehensive MOMENT analysis using Gemini AI
 * Analyzes individual moments (photos, audio, location check-ins)
 * Accepts: photo, audio transcript, location, user notes
 * Returns: Intelligent moment description with warnings for limited data
 */
router.post(
  '/analyze',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log('[Memory Analysis] 📥 Received request');
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

      console.log('[Memory Analysis] 📊 Request data:', {
        hasPhoto: !!(files?.photo && files.photo[0]),
        hasAudio: !!(files?.audio && files.audio[0]),
        hasLocation: !!(locationName || (latitude && longitude)),
        hasUserNote: !!userNote,
        hasAudioTranscript: !!audioTranscript,
        hasAudioEmotion: !!audioEmotion,
      });

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
        console.log('[Memory Analysis] 📸 Photo file:', files.photo[0].path);
      }

      // Add audio file if provided (Gemini can process audio directly)
      let transcribedText: string | null = null;
      if (files?.audio && files.audio[0]) {
        input.audioPath = files.audio[0].path;
        console.log('[Memory Analysis] 🎤 Audio file:', files.audio[0].path);
        
        // Transcribe audio for better accuracy
        console.log('[Memory Analysis] 🎙️ Transcribing audio...');
        transcribedText = await transcribeAudio(files.audio[0].path);
        if (transcribedText) {
          input.audioTranscript = transcribedText;
          console.log('[Memory Analysis] ✅ Audio transcribed successfully');
        } else {
          console.log('[Memory Analysis] ⚠️ Audio transcription failed, continuing without transcript');
        }
      }

      // Add audio transcript if provided (from frontend emotion analysis or transcription)
      if (audioTranscript && !transcribedText) {
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

      const dataSources = Object.keys(input).filter(k => input[k] && k !== 'timestamp');
      console.log('[Memory Analysis] 🔍 Analyzing with data sources:', dataSources);

      // Call Gemini for comprehensive MOMENT analysis
      const result = await analyzeMomentWithGemini(input);
      
      if (result) {
        console.log('[Memory Analysis] ✅ Gemini analysis successful:', {
          summary: result.summary,
          dataQuality: result.dataQuality,
          usedGemini: true,
        });
      } else {
        console.log('[Memory Analysis] ⚠️ Gemini analysis returned null - using fallback');
      }

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

      // Return Gemini analysis with transcript if available
      res.json({
        ...result,
        usedGemini: true,
        audioTranscript: transcribedText || audioTranscript || undefined,
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

