/**
 * Shared Rate Limiter for all Gemini services
 * 
 * Ensures we stay within free tier limits across:
 * - Moments analysis (individual entries)
 * - Memories analysis (daily summaries)
 * - Image analysis
 * - Audio transcription
 * 
 * Free tier limits for gemini-2.5-flash:
 * - RPM: 5 requests/minute
 * - Daily: 500 requests/day (conservative)
 */

// Rate limits - conservative to stay within free tier
const RATE_LIMIT_PER_MINUTE = 4; // Free tier: 5/min, using 4 for buffer
const RATE_LIMIT_PER_DAY = 500; // Conservative daily limit

const requestTimestamps: number[] = [];
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();

// Track usage by service for debugging
const usageByService: { [service: string]: number } = {};

/**
 * Check if we're within rate limits
 */
export function checkRateLimit(): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const currentDate = new Date().toDateString();

  // Reset daily counter if it's a new day
  if (currentDate !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = currentDate;
    Object.keys(usageByService).forEach(key => usageByService[key] = 0);
    console.log('[Gemini Rate Limiter] Daily rate limit reset');
  }

  // Check daily limit
  if (dailyRequestCount >= RATE_LIMIT_PER_DAY) {
    return {
      allowed: false,
      reason: `Daily limit reached (${RATE_LIMIT_PER_DAY} requests per day)`,
    };
  }

  // Remove timestamps older than 1 minute
  const oneMinuteAgo = now - 60000;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }

  // Check per-minute limit
  if (requestTimestamps.length >= RATE_LIMIT_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Rate limit reached (${RATE_LIMIT_PER_MINUTE} requests per minute)`,
    };
  }

  return { allowed: true };
}

/**
 * Record a successful API request
 */
export function recordRequest(service: string = 'unknown') {
  requestTimestamps.push(Date.now());
  dailyRequestCount++;
  
  // Track by service
  usageByService[service] = (usageByService[service] || 0) + 1;

  const remainingToday = RATE_LIMIT_PER_DAY - dailyRequestCount;
  const remainingThisMin = RATE_LIMIT_PER_MINUTE - requestTimestamps.length;

  console.log(`[Gemini Rate Limiter] ${service}: ${dailyRequestCount}/${RATE_LIMIT_PER_DAY} today (${remainingToday} left), ${requestTimestamps.length}/${RATE_LIMIT_PER_MINUTE} last min (${remainingThisMin} left)`);

  // Warn when approaching limits
  if (remainingToday < 50) {
    console.warn(`⚠️ [Gemini Rate Limiter] Low daily quota: ${remainingToday} requests remaining`);
  }
  if (remainingThisMin < 1) {
    console.warn(`⚠️ [Gemini Rate Limiter] Approaching per-minute limit: ${remainingThisMin} remaining this minute`);
  }
}

/**
 * Get current usage stats
 */
export function getUsageStats() {
  return {
    dailyCount: dailyRequestCount,
    dailyLimit: RATE_LIMIT_PER_DAY,
    dailyRemaining: RATE_LIMIT_PER_DAY - dailyRequestCount,
    perMinuteCount: requestTimestamps.length,
    perMinuteLimit: RATE_LIMIT_PER_MINUTE,
    perMinuteRemaining: RATE_LIMIT_PER_MINUTE - requestTimestamps.length,
    byService: usageByService,
  };
}

