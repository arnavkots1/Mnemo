/**
 * MemoriesScreen - NEW 5th Tab
 * Shows AI-generated daily memory summaries
 * Auto-generates at end of day
 * Fully responsive design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useMemoryContext } from '../store/MemoryContext';
import { MemoryEntry } from '../types/MemoryEntry';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';
import { API_CONFIG, checkBackendHealth } from '../config/apiConfig';
import { testBackendConnection, getNetworkDiagnostics } from '../utils/networkDebug';
import { GlassSurface } from '../components/GlassSurface';

interface DailySummary {
  date: string;
  count: number;
  summary: string;
  description?: string; // Detailed description from Gemini
  highlights: string[];
  memories: MemoryEntry[];
  warnings?: string[]; // Data quality warnings
  dataQuality?: 'excellent' | 'good' | 'limited' | 'minimal'; // Data quality level
}

export const MemoriesScreen: React.FC = () => {
  const { memories: moments } = useMemoryContext(); // NOTE: These are MOMENTS, not memories
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const dimensions = useWindowDimensions();
  
  useEffect(() => {
    console.log(`📊 [MEMORIES] Screen loaded with ${moments.length} moment${moments.length === 1 ? '' : 's'} available for summary generation`);
    console.log(`📊 [MEMORIES] Current summaries: ${dailySummaries.length}`);
  }, [moments.length, dailySummaries.length]);
  
  const handleDeleteSummary = (index: number) => {
    Alert.alert(
      'Delete Summary',
      `Are you sure you want to delete the summary for ${formatDate(dailySummaries[index].date)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = dailySummaries.filter((_, i) => i !== index);
            setDailySummaries(updated);
          },
        },
      ]
    );
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  // Responsive sizing
  const isSmallScreen = dimensions.width < 380;
  const isTinyScreen = dimensions.width < 350;
  const titleSize = isTinyScreen ? 24 : isSmallScreen ? 28 : 32;
  const subtitleSize = isTinyScreen ? 12 : isSmallScreen ? 13 : 14;
  const dateSize = isTinyScreen ? 16 : isSmallScreen ? 18 : 20;
  const summarySize = isTinyScreen ? 13 : isSmallScreen ? 14 : 15;
  const countSize = isTinyScreen ? 11 : isSmallScreen ? 12 : 13;
  
  // DO NOT auto-generate on mount - only generate when:
  // 1. User clicks "Generate Now" button
  // 2. End of day (11:55 PM)
  // This keeps Memories tab empty until explicitly generated
  useEffect(() => {
    // Load previously generated summaries from storage if any
    // (Optional: implement persistent storage later)
  }, []);
  
  // Check for end of day and auto-generate
  useEffect(() => {
    const checkEndOfDay = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // Auto-generate at 11:55 PM
      if (hour === 23 && minute === 55) {
        console.log('🌙 [MEMORIES] End of day - auto-generating daily summaries');
        generateDailySummaries();
        // TODO: Save to AsyncStorage for persistence
      }
    };
    
    // Check every minute
    const interval = setInterval(checkEndOfDay, 60000);
    return () => clearInterval(interval);
  }, [moments]);
  
  const generateDailySummaries = async () => {
    try {
      // First check if backend is reachable
      console.log(`🔍 [MEMORIES] Checking backend health...`);
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        console.warn(`⚠️ [MEMORIES] Backend health check failed - backend may be unreachable`);
        console.warn(`   Using local fallback instead`);
        generateLocalSummaries();
        return;
      }
      console.log(`✅ [MEMORIES] Backend is reachable`);
      
      const apiUrl = `${API_CONFIG.BASE_URL}/api/memory/daily-summaries`;
      console.log(`🚀 [MEMORIES] Calling backend API for daily summaries from ${moments.length} moment${moments.length === 1 ? '' : 's'}...`);
      console.log(`🌐 [MEMORIES] API URL: ${apiUrl}`);
      console.log(`🌐 [MEMORIES] API_CONFIG.BASE_URL: ${API_CONFIG.BASE_URL}`);
      console.log(`📤 [MEMORIES] Sending ${moments.length} moment${moments.length === 1 ? '' : 's'} to backend`);
      
      // Call backend API for AI-powered summaries
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`⏱️ [MEMORIES] Request timeout after 60s - aborting`);
        controller.abort();
      }, 60000); // 60s timeout for Gemini
      
      const requestBody = JSON.stringify({ memories: moments });
      console.log(`📦 [MEMORIES] Request body size: ${requestBody.length} bytes`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📥 [MEMORIES] Response received: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [MEMORIES] API error ${response.status}: ${errorText}`);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`✅ [MEMORIES] Backend generated ${result.summaries?.length || 0} daily summar${result.summaries?.length === 1 ? 'y' : 'ies'}`);
      
      // Convert backend format to local format
      const summaries: DailySummary[] = (result.summaries || []).map((s: any) => ({
        date: s.date,
        count: s.count,
        summary: s.summary,
        description: s.description || '', // Include description from backend
        highlights: s.highlights || [],
        memories: moments.filter(m => {
          const momentDate = new Date(m.startTime).toDateString();
          return momentDate === s.date;
        }),
        warnings: s.warnings || [], // Include warnings from backend
        dataQuality: s.dataQuality || 'limited', // Include data quality
      }));
      
      setDailySummaries(summaries);
      console.log(`📊 [MEMORIES] Set ${summaries.length} daily summar${summaries.length === 1 ? 'y' : 'ies'} in state`);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏱️ [MEMORIES] Request aborted (timeout or cancelled)`);
        console.error(`   This usually means the backend is unreachable or taking too long`);
        console.error(`   Check: 1) Backend is running on ${API_CONFIG.BASE_URL}`);
        console.error(`         2) Phone and computer are on same network`);
        console.error(`         3) Firewall allows connections on port 3000`);
        console.error(`         4) Backend IP matches: ${API_CONFIG.BASE_URL}`);
      } else {
        console.error(`❌ [MEMORIES] Error calling backend:`, error);
        if (error instanceof Error) {
          console.error(`   Error message: ${error.message}`);
          console.error(`   Error name: ${error.name}`);
        }
      }
      // Fallback to local generation
      console.log(`📝 [MEMORIES] Falling back to local summary generation`);
      generateLocalSummaries();
    }
  };
  
  const generateLocalSummaries = () => {
    console.log(`📝 [MEMORIES] Generating local summaries from ${moments.length} moment${moments.length === 1 ? '' : 's'}...`);
    // Group moments by day
    const grouped = new Map<string, MemoryEntry[]>();
    
    moments.forEach(moment => {
      const date = new Date(moment.startTime).toDateString();
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(moment);
    });
    
    console.log(`📦 [MEMORIES] Grouped into ${grouped.size} day${grouped.size === 1 ? '' : 's'}`);
    
    // Generate summaries for each day
    const summaries: DailySummary[] = [];
    
    for (const [date, dayMoments] of grouped.entries()) {
      const summary = generateSummaryForDay(dayMoments, date);
      summaries.push(summary);
      console.log(`   📅 [MEMORIES] Generated summary for ${date}: ${dayMoments.length} moment${dayMoments.length === 1 ? '' : 's'}`);
    }
    
    // Sort by date (newest first)
    summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setDailySummaries(summaries);
    console.log(`✅ [MEMORIES] Set ${summaries.length} local summar${summaries.length === 1 ? 'y' : 'ies'} in state`);
  };
  
  const generateSummaryForDay = (dayMemories: MemoryEntry[], date: string): DailySummary => {
    const voiceCount = dayMemories.filter(m => m.kind === 'emotional').length;
    const photoCount = dayMemories.filter(m => m.kind === 'photo').length;
    const placeCount = dayMemories.filter(m => m.kind === 'context').length;
    
    // Generate intelligent summary
    let summary = '';
    const highlights: string[] = [];
    
    if (dayMemories.length === 0) {
      summary = 'No memories captured today.';
    } else if (dayMemories.length === 1) {
      summary = `You captured 1 memory today.`;
      highlights.push(dayMemories[0].summary);
    } else {
      summary = `You captured ${dayMemories.length} memories today`;
      
      const parts: string[] = [];
      if (voiceCount > 0) parts.push(`${voiceCount} voice note${voiceCount > 1 ? 's' : ''}`);
      if (photoCount > 0) parts.push(`${photoCount} photo${photoCount > 1 ? 's' : ''}`);
      if (placeCount > 0) parts.push(`${placeCount} place${placeCount > 1 ? 's' : ''}`);
      
      if (parts.length > 0) {
        summary += ': ' + parts.join(', ');
      }
      
      // Pick top 3 highlights
      highlights.push(...dayMemories.slice(0, 3).map(m => m.summary));
    }
    
    return {
      date,
      count: dayMemories.length,
      summary,
      highlights,
      memories: dayMemories,
    };
  };
  
  const handleGenerateNow = async () => {
    console.log(`🎯 [MEMORIES] Generate Now button pressed. Available moments: ${moments.length}`);
    if (moments.length === 0) {
      console.log(`⚠️ [MEMORIES] No moments available for summary generation`);
      Alert.alert('No Moments Yet', 'Add some moments first, then generate daily summaries from them.');
      return;
    }
    
    // First, test backend connection with detailed diagnostics
    console.log(`🔍 [MEMORIES] Testing backend connection before generating...`);
    const diagnostics = getNetworkDiagnostics();
    console.log(`📊 [MEMORIES] Network diagnostics:`, JSON.stringify(diagnostics, null, 2));
    
    const connectionTest = await testBackendConnection();
    if (!connectionTest.success) {
      const errorMsg = connectionTest.error || 'Unknown error';
      console.error(`❌ [MEMORIES] Backend connection test failed:`, errorMsg);
      Alert.alert(
        'Backend Unreachable',
        `Cannot connect to backend.\n\n` +
        `URL: ${diagnostics.baseUrl}\n` +
        `Error: ${errorMsg}\n\n` +
        `Troubleshooting:\n` +
        `1. Backend running? Check terminal\n` +
        `2. Same Wi-Fi network?\n` +
        `3. IP correct? Expected: 192.168.88.10\n` +
        `4. Firewall allows port 3000?\n` +
        `5. Try: ipconfig to check your IP\n\n` +
        `Using local fallback instead.`,
        [{ text: 'OK' }]
      );
    } else {
      console.log(`✅ [MEMORIES] Backend connection test successful (${connectionTest.details.responseTime}ms)`);
    }
    
    setIsGenerating(true);
    try {
      await generateDailySummaries();
      console.log(`✅ [MEMORIES] Successfully generated summaries`);
      Alert.alert('✨ Generated!', `Created daily summaries from ${moments.length} moment${moments.length === 1 ? '' : 's'}`);
      // TODO: Save to AsyncStorage for persistence
    } catch (error) {
      console.error(`❌ [MEMORIES] Error generating summaries:`, error);
      Alert.alert('Error', 'Failed to generate summaries');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <GlassSurface style={styles.header} intensity={26}>
        <View>
          <Text style={[styles.title, { fontSize: titleSize }]}>Memories</Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
            AI-generated daily summaries
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={handleGenerateNow}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={Colors.textPrimary} />
          ) : (
            <Text style={[styles.generateButtonText, { fontSize: countSize }]}>
              Generate Now
            </Text>
          )}
        </TouchableOpacity>
      </GlassSurface>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dailySummaries.length === 0 ? (
          // Empty State
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { fontSize: isTinyScreen ? 48 : 64 }]}>📖</Text>
            <Text style={[styles.emptyTitle, { fontSize: dateSize }]}>
              No Memories Yet
            </Text>
            <Text style={[styles.emptyText, { fontSize: summarySize }]}>
              Start capturing moments in the Moments tab or use Vision to create your first memory.
            </Text>
            <Text style={[styles.emptyHint, { fontSize: countSize }]}>
              Memories auto-generate at the end of each day
            </Text>
          </View>
        ) : (
          // Daily Summaries
          dailySummaries.map((summary, index) => (
            <GlassSurface key={index} style={styles.summaryCard} intensity={24}>
              <View style={styles.summaryHeader}>
                <Text style={[styles.summaryDate, { fontSize: dateSize }]}>
                  {formatDate(summary.date)}
                </Text>
                <View style={styles.summaryHeaderActions}>
                  <View style={styles.countBadge}>
                    <Text style={[styles.countText, { fontSize: countSize }]}>
                      {summary.count} {summary.count === 1 ? 'memory' : 'memories'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteSummaryButton}
                    onPress={() => handleDeleteSummary(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteSummaryButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* AI-Generated Summary (Brief) */}
              <Text style={[styles.summaryText, { fontSize: summarySize }]}>
                {summary.summary}
              </Text>
              
              {/* AI-Generated Description (Detailed) */}
              {summary.description && summary.description.trim() && (
                <Text style={[styles.descriptionText, { fontSize: summarySize - 1 }]}>
                  {summary.description}
                </Text>
              )}
              
              {/* Data Quality Warning */}
              {summary.warnings && summary.warnings.length > 0 && (
                <GlassSurface style={styles.warningContainer} intensity={20}>
                  <Text style={[styles.warningIcon, { fontSize: summarySize }]}>⚠️</Text>
                  <Text style={[styles.warningText, { fontSize: countSize }]}>
                    {summary.warnings.join('. ')}
                  </Text>
                </GlassSurface>
              )}
              
              {summary.dataQuality === 'minimal' || summary.dataQuality === 'limited' ? (
                <GlassSurface style={styles.qualityBadge} intensity={20}>
                  <Text style={[styles.qualityText, { fontSize: countSize }]}>
                    Limited data available
                  </Text>
                </GlassSurface>
              ) : null}
              
              {summary.highlights.length > 0 && (
                <View style={styles.highlightsContainer}>
                  <Text style={[styles.highlightsTitle, { fontSize: countSize }]}>
                    Highlights:
                  </Text>
                  {summary.highlights.map((highlight, i) => (
                    <View key={i} style={styles.highlightItem}>
                      <View style={styles.highlightDot} />
                      <Text 
                        style={[styles.highlightText, { fontSize: countSize + 1 }]}
                        numberOfLines={2}
                      >
                        {highlight}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </GlassSurface>
          ))
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.extraLarge + 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.extraLarge,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    ...Shadows.small,
  },
  generateButtonText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.extraLarge * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  emptyHint: {
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: 'rgba(52, 55, 60, 0.75)',
    borderRadius: BorderRadius.extraLarge,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.medium,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryDate: {
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.cardDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deleteSummaryButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSummaryButtonText: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.textSecondary,
    lineHeight: 24,
    opacity: 0.7,
  },
  countText: {
    color: Colors.charcoalDark,
    fontWeight: '600',
  },
  summaryText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    opacity: 0.85,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.cardDark,
    borderRadius: BorderRadius.large,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  warningIcon: {
    marginRight: Spacing.xs,
    color: Colors.charcoalDark,
  },
  warningText: {
    flex: 1,
    color: Colors.charcoalDark,
    lineHeight: 16,
  },
  qualityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.cardDark,
    borderRadius: BorderRadius.large,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qualityText: {
    color: Colors.charcoalDark,
    fontWeight: '500',
  },
  highlightsContainer: {
    marginTop: Spacing.xs,
  },
  highlightsTitle: {
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  highlightDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  highlightText: {
    flex: 1,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
});
