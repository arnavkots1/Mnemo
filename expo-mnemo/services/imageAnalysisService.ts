/**
 * ImageAnalysisService - Analyzes images using backend API
 * 
 * Calls backend API to generate memory summaries from images.
 */

export interface ImageAnalysisRequest {
  imageUri?: string;
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
  };
  timeOfDay?: string;
  dayOfWeek?: string;
  fakeId?: string;
}

export interface ImageAnalysisResponse {
  summary: string;
  description: string;
  tags?: string[];
  confidence: number;
}

let apiConfig: {
  useApi: boolean;
  apiUrl?: string;
} = {
  useApi: false,
};

/**
 * Configure image analysis service
 */
export function configureImageAnalysis(config: { useApi: boolean; apiUrl?: string }) {
  apiConfig = config;
}

/**
 * Analyze image using backend API with file upload
 */
export async function analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
  if (!apiConfig.useApi || !apiConfig.apiUrl) {
    // Fallback to local generation
    return generateLocalSummary(request);
  }
  
  // If we have imageUri, try file upload
  if (request.imageUri) {
    try {
      // Create FormData for file upload (React Native compatible)
      const formData = new FormData();
      
      // Extract filename from URI
      const fileName = request.imageUri.split('/').pop() || 'image.jpg';
      const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      // Append image file (React Native FormData format)
      formData.append('image', {
        uri: request.imageUri,
        type: fileType,
        name: fileName,
      } as any);
      
      // Append metadata as JSON string
      formData.append('metadata', JSON.stringify({
        location: request.location,
        timeOfDay: request.timeOfDay,
        dayOfWeek: request.dayOfWeek,
      }));
      
      // Add timeout for image upload (60 seconds for large images, especially through tunnel)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      try {
        const uploadUrl = `${apiConfig.apiUrl}/analyze-image-upload`;
        console.log(`📤 Uploading image to: ${uploadUrl}`);
        console.log(`📤 Image URI: ${request.imageUri}`);
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            // Don't set Content-Type - let FormData set it with boundary
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`❌ Upload failed: ${uploadResponse.status} - ${errorText}`);
          
          // If timeout (408) or server error (500+), fall back to local generation
          if (uploadResponse.status === 408 || uploadResponse.status >= 500) {
            console.warn(`⚠️ Server timeout/error (${uploadResponse.status}), falling back to local image analysis`);
            return generateLocalSummary(request);
          }
          
          // For other errors (400, 401, etc.), still throw but will be caught below
          throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
        }
        
        const result = await uploadResponse.json() as ImageAnalysisResponse;
        console.log('✅ Image uploaded and analyzed successfully');
        return result;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error('❌ Image upload timed out after 60 seconds');
          console.warn('⚠️ Falling back to local image analysis');
          // Fall back to local generation instead of throwing
          return generateLocalSummary(request);
        }
        
        // Check if error message indicates timeout or network issue
        const errorMessage = error.message || String(error);
        if (errorMessage.includes('408') || errorMessage.includes('timeout') || errorMessage.includes('network')) {
          console.warn(`⚠️ Network/timeout error detected, falling back to local image analysis: ${errorMessage}`);
          return generateLocalSummary(request);
        }
        
        console.error('❌ Upload error:', errorMessage);
        // For other errors, try legacy endpoint or fall back
        throw error;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Fall back to legacy endpoint
    }
  }
  
  // Legacy endpoint (for backward compatibility)
  try {
    const response = await fetch(`${apiConfig.apiUrl}/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json() as ImageAnalysisResponse;
    return result;
  } catch (error) {
    console.error('Error calling image analysis API:', error);
    // Fallback to local generation
    return generateLocalSummary(request);
  }
}

/**
 * Generate summary locally (fallback)
 */
function generateLocalSummary(request: ImageAnalysisRequest): ImageAnalysisResponse {
  const parts: string[] = [];
  
  if (request.timeOfDay) {
    const timeLabels: { [key: string]: string } = {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night',
    };
    parts.push(timeLabels[request.timeOfDay] || request.timeOfDay);
  }
  
  if (request.location?.placeName) {
    parts.push(`at ${request.location.placeName}`);
  }
  
  const summary = parts.length > 0 ? `${parts.join(' ')} photo` : 'Photo moment';
  
  return {
    summary,
    description: `A memorable moment captured. ${summary}`,
    tags: ['photo', 'memory'],
    confidence: 0.7,
  };
}

