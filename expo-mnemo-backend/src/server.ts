/**
 * Mnemo Backend Server
 * 
 * Express server providing emotion classification API endpoint.
 * This is a stub implementation for development/testing.
 */

import express from 'express';
import cors from 'cors';
import { emotionRouter } from './routes/emotion';
import { imageRouter } from './routes/image';
import { initializeModel } from './services/modelLoader';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize ML model on startup
console.log('🔧 Initializing ML model...');
initializeModel();

// Middleware
app.use(cors()); // Allow requests from Expo app
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For file uploads

// Routes
app.use('/api', emotionRouter);
app.use('/api', imageRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mnemo backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mnemo backend server running on http://localhost:${PORT}`);
  console.log(`📡 Emotion API: http://localhost:${PORT}/api/classify-emotion`);
  console.log(`🖼️  Image API: http://localhost:${PORT}/api/analyze-image`);
});

