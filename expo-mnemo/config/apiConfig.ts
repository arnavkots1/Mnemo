/**
 * API Configuration
 * 
 * Auto-configures backend API connection on app startup.
 * Detects if backend is running and configures services accordingly.
 */

import { configureEmotionClassifier } from '../services/EmotionClassifier';
import { configureImageAnalysis } from '../services/imageAnalysisService';

// Backend API URL Configuration
// 
// Using IP address works for both emulators and physical devices!
// - Emulator: Can use IP address (works fine)
// - Physical device: Must use IP address (localhost doesn't work)
// - Tunnel mode: Set EXPO_PUBLIC_API_URL to tunnel URL if needed
//
// To override: Set EXPO_PUBLIC_API_URL environment variable
// Example: export EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
//
// Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
// Look for "IPv4 Address" - that's what you need

const DEFAULT_IP = '172.16.140.158'; // Fallback IP if tunnel is not used

function normalizeApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

// Priority: 1. EXPO_PUBLIC_API_URL env var, 2. Tunnel URL, 3. Default IP
const BACKEND_API_URL =
  (process.env.EXPO_PUBLIC_API_URL
    ? normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL)
    : null) ||
  (process.env.EXPO_PUBLIC_TUNNEL_URL
    ? normalizeApiUrl(process.env.EXPO_PUBLIC_TUNNEL_URL)
    : null) ||
  `http://${DEFAULT_IP}:3000/api`;

// Export API config for use in services
export const API_CONFIG = {
  BASE_URL: BACKEND_API_URL.replace(/\/api$/, ''), // Base URL without /api
  API_URL: BACKEND_API_URL, // Full API URL
};

/**
 * Initialize API configuration
 * Called automatically when app starts
 */
export function initializeApiConfig(): void {
  console.log('🔧 [API_CONFIG] Configuring API services...');
  console.log(`🌐 [API_CONFIG] BACKEND_API_URL: ${BACKEND_API_URL}`);
  console.log(`🌐 [API_CONFIG] BASE_URL: ${API_CONFIG.BASE_URL}`);
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL !== process.env.EXPO_PUBLIC_API_URL.trim()) {
    console.warn('⚠️ [API_CONFIG] EXPO_PUBLIC_API_URL had extra whitespace and was trimmed');
  }
  console.log(`🌐 [API_CONFIG] EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL?.trim() || 'not set (using default IP)'}`);
  
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
  
  console.log(`✅ [API_CONFIG] API configured: ${BACKEND_API_URL}`);
  console.log(`   Base URL: ${API_CONFIG.BASE_URL}`);
  console.log(`   Works with both emulators and physical devices`);
  console.log('   Backend will be used for emotion classification and image analysis');
}

/**
 * Check if backend is available
 * Useful for showing connection status in UI
 */
export async function checkBackendHealth(): Promise<boolean> {
  const baseUrl = BACKEND_API_URL.replace('/api', '');
  const healthUrl = `${baseUrl}/health`;
  
  console.log(`🔍 [API_CONFIG] Checking backend health...`);
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Health URL: ${healthUrl}`);
  console.log(`   BACKEND_API_URL: ${BACKEND_API_URL}`);
  
  try {
    // Use AbortController for timeout (more compatible than AbortSignal.timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ [API_CONFIG] Health check timeout after 10s`);
      controller.abort();
    }, 10000); // Increased to 10 seconds
    
    console.log(`📡 [API_CONFIG] Sending GET request to ${healthUrl}...`);
    const startTime = Date.now();
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    
    const duration = Date.now() - startTime;
    clearTimeout(timeoutId);
    
    console.log(`📥 [API_CONFIG] Health check response: ${response.status} ${response.statusText} (${duration}ms)`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ [API_CONFIG] Backend is healthy:`, data);
      return true;
    } else {
      console.warn(`⚠️ [API_CONFIG] Backend returned non-OK status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ [API_CONFIG] Health check failed:`, error.name, error.message);
      if (error.name === 'AbortError') {
        console.error(`   → Request timed out - backend unreachable or slow`);
      } else if (error.message.includes('Network request failed')) {
        console.error(`   → Network error - check:`);
        console.error(`     1. Phone and computer on same Wi-Fi network`);
        console.error(`     2. Backend IP is correct: ${baseUrl}`);
        console.error(`     3. Firewall allows connections on port 3000`);
        console.error(`     4. Backend is running on 0.0.0.0:3000`);
      } else {
        console.error(`   → Error details:`, error);
      }
    } else {
      console.error(`❌ [API_CONFIG] Health check failed:`, error);
    }
    return false;
  }
}

