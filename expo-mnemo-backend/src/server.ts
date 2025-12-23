/**
 * Mnemo Backend Server
 * 
 * Express server providing emotion classification API endpoint.
 * This is a stub implementation for development/testing.
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { emotionRouter } from './routes/emotion';
import { imageRouter } from './routes/image';
import { initializeModel } from './services/modelLoader';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize ML model on startup
console.log('🔧 Initializing ML model...');
initializeModel();

// Middleware
app.use(cors()); // Allow requests from Expo app
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For file uploads

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 [Server] ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.path.includes('daily-summaries')) {
    console.log(`📥 [Server] Daily summaries request from ${req.ip || 'unknown'}`);
  }
  next();
});

// Import memory analysis routes
import memoryAnalysisRouter from './routes/memoryAnalysis';
import dailySummariesRouter from './routes/dailySummaries';

// Routes
app.use('/api', emotionRouter);
app.use('/api', imageRouter);
app.use('/api/memory', memoryAnalysisRouter); // Comprehensive memory analysis
app.use('/api/memory', dailySummariesRouter); // Daily summaries

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mnemo backend is running' });
});

// Start server - listen on all interfaces (0.0.0.0) to accept connections from other devices
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mnemo backend server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Emotion API: http://localhost:${PORT}/api/classify-emotion`);
  console.log(`🖼️  Image API: http://localhost:${PORT}/api/analyze-image`);
  console.log(`🌐 Accessible from network at: http://172.20.10.6:${PORT}`);
  console.log(`   ⚠️  If this IP is wrong, update apiConfig.ts in expo-mnemo with your actual IP`);
  console.log(`   💡 Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)`);
});

