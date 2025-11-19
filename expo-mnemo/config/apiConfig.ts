/**
 * API Configuration
 * 
 * Auto-configures backend API connection on app startup.
 * Detects if backend is running and configures services accordingly.
 */

import { configureEmotionClassifier } from '../services/EmotionClassifier';
import { configureImageAnalysis } from '../services/imageAnalysisService';

// Backend API URL
// For local development: Use your computer's IP address (not localhost)
// For production: Use your deployed backend URL
// 
// ⚠️ IMPORTANT: Change this to your computer's IP address!
// Find your IP:
//   Windows: Run `ipconfig` → Look for "IPv4 Address"
//   Mac/Linux: Run `ifconfig` → Look for "inet" address
//   Example: 'http://192.168.1.100:3000/api'
const BACKEND_API_URL = 'http://172.20.10.6:3000/api'; // ⚠️ CHANGE THIS!

/**
 * Initialize API configuration
 * Called automatically when app starts
 */
export function initializeApiConfig(): void {
  console.log('🔧 Configuring API services...');
  
  // Configure emotion classifier
  configureEmotionClassifier({
    useApi: true, // Enable API usage
    apiUrl: BACKEND_API_URL,
  });
  
  // Configure image analysis
  configureImageAnalysis({
    useApi: true, // Enable API usage
    apiUrl: BACKEND_API_URL,
  });
  
  console.log(`✅ API configured: ${BACKEND_API_URL}`);
  console.log('   Backend will be used for emotion classification and image analysis');
}

/**
 * Check if backend is available
 * Useful for showing connection status in UI
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const baseUrl = BACKEND_API_URL.replace('/api', '');
    
    // Use AbortController for timeout (more compatible than AbortSignal.timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

