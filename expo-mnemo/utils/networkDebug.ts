/**
 * Network Debugging Utilities
 * 
 * Helps debug backend connectivity issues
 */

import { API_CONFIG } from '../config/apiConfig';

/**
 * Test backend connectivity with detailed diagnostics
 */
export async function testBackendConnection(): Promise<{
  success: boolean;
  error?: string;
  details: {
    url: string;
    baseUrl: string;
    responseTime?: number;
    status?: number;
    statusText?: string;
  };
}> {
  const baseUrl = API_CONFIG.BASE_URL;
  const healthUrl = `${baseUrl}/health`;
  
  const details = {
    url: healthUrl,
    baseUrl: baseUrl,
  };
  
  try {
    console.log(`🔍 [NETWORK_DEBUG] Testing connection to: ${healthUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ [NETWORK_DEBUG] Request timeout`);
      controller.abort();
    }, 5000); // 5 second timeout
    
    const startTime = Date.now();
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const responseTime = Date.now() - startTime;
    clearTimeout(timeoutId);
    
    console.log(`📥 [NETWORK_DEBUG] Response: ${response.status} ${response.statusText} (${responseTime}ms)`);
    
    const data = await response.json();
    console.log(`📦 [NETWORK_DEBUG] Response data:`, data);
    
    return {
      success: response.ok,
      details: {
        ...details,
        responseTime,
        status: response.status,
        statusText: response.statusText,
      },
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - backend unreachable';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Network request failed - check Wi-Fi connection';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to fetch - backend may be down or unreachable';
      }
    }
    
    console.error(`❌ [NETWORK_DEBUG] Connection test failed:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      details,
    };
  }
}

/**
 * Get network diagnostics info
 */
export function getNetworkDiagnostics(): {
  apiUrl: string;
  baseUrl: string;
  backendApiUrl: string;
  environment: {
    expoPublicApiUrl?: string;
  };
} {
  return {
    apiUrl: API_CONFIG.API_URL,
    baseUrl: API_CONFIG.BASE_URL,
    backendApiUrl: API_CONFIG.BASE_URL,
    environment: {
      expoPublicApiUrl: process.env.EXPO_PUBLIC_API_URL || undefined,
    },
  };
}

