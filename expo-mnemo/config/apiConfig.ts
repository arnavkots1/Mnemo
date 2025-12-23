/**
 * API Configuration
 * 
 * Auto-configures backend API connection on app startup.
 * Detects if backend is running and configures services accordingly.
 */

import { configureEmotionClassifier } from '../services/EmotionClassifier';
import { configureImageAnalysis } from '../services/imageAnalysisService';

// Backend API URL
// For local development: set EXPO_PUBLIC_API_URL to your LAN or tunnel URL
// Example LAN:   http://192.168.88.13:3000/api
// Example tunnel: https://<your-tunnel>.ngrok-free.app/api
const BACKEND_API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.88.10:3000/api'; // override with EXPO_PUBLIC_API_URL

// Export API config for use in services
export const API_CONFIG = {
  BASE_URL: BACKEND_API_URL.replace('/api', ''), // Base URL without /api
  API_URL: BACKEND_API_URL, // Full API URL
};

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

