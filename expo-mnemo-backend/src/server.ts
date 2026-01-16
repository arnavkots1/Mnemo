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
import locationRouter from './routes/location';
import { initializeModel } from './services/modelLoader';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize ML model on startup
console.log('🔧 Initializing ML model...');
initializeModel();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})); // Allow requests from Expo app
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For file uploads

// Request logging middleware (reduced logging)
app.use((req, res, next) => {
  // Only log important requests
  if (req.path === '/health' || req.path.includes('/api/')) {
    console.log(`📥 ${req.method} ${req.path}`);
  }
  next();
});

// Import memory analysis routes
import memoryAnalysisRouter from './routes/memoryAnalysis';
import dailySummariesRouter from './routes/dailySummaries';

// Routes
app.use('/api', emotionRouter);
app.use('/api', imageRouter);
app.use('/api/location', locationRouter); // Google Places location lookup
app.use('/api/memory', memoryAnalysisRouter); // Comprehensive memory analysis
app.use('/api/memory', dailySummariesRouter); // Daily summaries

// Health check endpoint
app.get('/health', (req, res) => {
  console.log(`✅ [Health] Health check request from ${req.ip || req.headers['x-forwarded-for'] || 'unknown'}`);
  res.json({ status: 'ok', message: 'Mnemo backend is running', timestamp: new Date().toISOString() });
});

// Start server - listen on all interfaces (0.0.0.0) to accept connections from other devices
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mnemo backend server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Emotion API: http://localhost:${PORT}/api/classify-emotion`);
  console.log(`🖼️  Image API: http://localhost:${PORT}/api/analyze-image`);
  
  // Start tunnel if enabled (async, don't block server startup)
  if (process.env.USE_TUNNEL === 'true') {
    import('./tunnel').then(({ startTunnel }) => {
      startTunnel().then((tunnelUrl) => {
        if (tunnelUrl) {
          console.log(`\n✨ [Tunnel] Backend is accessible via tunnel!`);
          console.log(`   Set EXPO_PUBLIC_API_URL=${tunnelUrl}/api in your Expo app`);
          console.log(`   Or add to your .env file: EXPO_PUBLIC_API_URL=${tunnelUrl}/api`);
        }
      }).catch((err) => {
        console.error('❌ [Tunnel] Failed to start tunnel:', err);
      });
    });
  } else {
    console.log(`🌐 Accessible from network at: http://172.16.140.220:${PORT}`);
    console.log(`   ⚠️  If this IP is wrong, update apiConfig.ts in expo-mnemo with your actual IP`);
    console.log(`   💡 Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)`);
    console.log(`   💡 Or run: npm run dev:tunnel (uses tunnel, no IP needed!)`);
  }
});

