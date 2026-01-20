/**
 * MemoriesScreen - NEW 5th Tab
 * Shows AI-generated daily memory summaries
 * Auto-generates at end of day
 * Fully responsive design
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { MemoryEntry } from '../types/MemoryEntry';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';
import { API_CONFIG, checkBackendHealth } from '../config/apiConfig';
import { testBackendConnection, getNetworkDiagnostics } from '../utils/networkDebug';
import { GlassSurface } from '../components/GlassSurface';
import { DailySummary, loadDailySummaries, saveDailySummaries, saveDailySummary, deleteDailySummary } from '../store/DailySummariesStore';

export const MemoriesScreen: React.FC = () => {
  const { memories: moments } = useMemoryContext(); // NOTE: These are MOMENTS, not memories
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toDateString());
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const dimensions = useWindowDimensions();
  
  useEffect(() => {
    console.log(`📊 [MEMORIES] Screen loaded with ${moments.length} moment${moments.length === 1 ? '' : 's'} available for summary generation`);
    console.log(`📊 [MEMORIES] Current summaries: ${dailySummaries.length}`);
  }, [moments.length, dailySummaries.length]);
  
  const handleDeleteSummary = async (index: number) => {
    const summaryToDelete = dailySummaries[index];
    
    Alert.alert(
      'Delete Summary',
      `Are you sure you want to delete the summary for ${formatDate(summaryToDelete.date)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from storage
              await deleteDailySummary(summaryToDelete.date);
              
              // Update local state
              const updated = dailySummaries.filter((_, i) => i !== index);
              setDailySummaries(updated);
              
              console.log(`🗑️ [MEMORIES] Deleted summary for ${summaryToDelete.date}`);
            } catch (error) {
              console.error(`❌ [MEMORIES] Error deleting summary:`, error);
              Alert.alert('Error', 'Failed to delete summary');
            }
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
  
  const loadStoredSummaries = useCallback(async () => {
    try {
      console.log(`📖 [MEMORIES] Loading stored summaries from AsyncStorage...`);
      const stored = await loadDailySummaries();
      if (stored.length > 0) {
        console.log(`✅ [MEMORIES] Loaded ${stored.length} stored summar${stored.length === 1 ? 'y' : 'ies'}`);
        setDailySummaries(stored);
      } else {
        console.log(`📭 [MEMORIES] No stored summaries found`);
        setDailySummaries([]);
      }
    } catch (error) {
      console.error(`❌ [MEMORIES] Error loading stored summaries:`, error);
    }
  }, []);

  // Load summaries on mount and whenever the screen is focused
  useEffect(() => {
    loadStoredSummaries();
  }, [loadStoredSummaries]);

  useFocusEffect(
    useCallback(() => {
      loadStoredSummaries();
    }, [loadStoredSummaries])
  );
  
  // Check for end of day and auto-generate (only for most recent day)
  useEffect(() => {
    const checkEndOfDay = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // Auto-generate at 11:55 PM (only for the most recent day)
      if (hour === 23 && minute === 55) {
        const mostRecentDayMoments = getMostRecentDayMoments(moments);
        if (mostRecentDayMoments.length > 0) {
          console.log(`🌙 [MEMORIES] End of day - auto-generating daily summary for most recent day (${mostRecentDayMoments.length} moment${mostRecentDayMoments.length === 1 ? '' : 's'})`);
          const mostRecentDate = new Date(mostRecentDayMoments[0].startTime).toDateString();
          generateDailySummaries(mostRecentDayMoments, mostRecentDate);
          // Summary will be automatically saved to AsyncStorage by generateDailySummaries
        } else {
          console.log(`🌙 [MEMORIES] End of day - no moments to generate summary`);
        }
      }
    };
    
    // Check every minute
    const interval = setInterval(checkEndOfDay, 60000);
    return () => clearInterval(interval);
  }, [moments]);
  
  const generateDailySummaries = async (targetMoments: MemoryEntry[], targetDate: string) => {
    try {
      if (targetMoments.length === 0) {
        console.log(`⚠️ [MEMORIES] No moments found for ${targetDate}`);
        Alert.alert('No Moments', 'No moments found for the selected day. Add some moments first.');
        return;
      }
      console.log(`📅 [MEMORIES] Generating summary for day: ${targetDate} (${targetMoments.length} moment${targetMoments.length === 1 ? '' : 's'})`);
      
      // First check if backend is reachable
      console.log(`🔍 [MEMORIES] Checking backend health...`);
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        console.warn(`⚠️ [MEMORIES] Backend health check failed - backend may be unreachable`);
        console.warn(`   Using local fallback instead`);
        generateLocalSummaries(targetMoments, targetDate);
        return;
      }
      console.log(`✅ [MEMORIES] Backend is reachable`);
      
      const apiUrl = `${API_CONFIG.BASE_URL}/api/memory/daily-summaries`;
      console.log(`🚀 [MEMORIES] Calling backend API for daily summary from ${targetMoments.length} moment${targetMoments.length === 1 ? '' : 's'}...`);
      console.log(`🌐 [MEMORIES] API URL: ${apiUrl}`);
      console.log(`🌐 [MEMORIES] API_CONFIG.BASE_URL: ${API_CONFIG.BASE_URL}`);
      console.log(`📤 [MEMORIES] Sending ${targetMoments.length} moment${targetMoments.length === 1 ? '' : 's'} to backend for date: ${targetDate}`);
      
      // Call backend API for AI-powered summaries (only for most recent day)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`⏱️ [MEMORIES] Request timeout after 60s - aborting`);
        controller.abort();
      }, 60000); // 60s timeout for Gemini
      
      const requestBody = JSON.stringify({ 
        memories: targetMoments,
        targetDate, // Specify the target date
      });
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
      
      // Convert backend format to local format (should only be 1 summary)
      const summaries: DailySummary[] = (result.summaries || []).map((s: any) => ({
        id: s.id || `summary_${s.date.replace(/\s+/g, '_')}`, // Generate ID if missing
        date: s.date,
        count: s.count,
        summary: s.summary,
        description: s.description || '', // Include description from backend
        highlights: s.highlights || [],
        memories: targetMoments.filter(m => {
          const momentDate = new Date(m.startTime).toDateString();
          return momentDate === s.date;
        }),
        warnings: s.warnings || [], // Include warnings from backend
        dataQuality: s.dataQuality || 'limited', // Include data quality
      }));
      
      // Replace existing summary for this date if it exists, otherwise add it
      setDailySummaries(prev => {
        const filtered = prev.filter(s => s.date !== targetDate);
        const updated = [...filtered, ...summaries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Save to storage
        saveDailySummaries(updated).catch(error => {
          console.error(`❌ [MEMORIES] Error saving summaries to storage:`, error);
        });
        
        return updated;
      });
      console.log(`📊 [MEMORIES] Updated summaries (${summaries.length} new summary for ${targetDate})`);
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
      generateLocalSummaries(targetMoments, targetDate);
    }
  };
  
  /**
   * Get moments from the most recent day only
   */
  const getMostRecentDayMoments = (allMoments: MemoryEntry[]): MemoryEntry[] => {
    if (allMoments.length === 0) return [];
    
    // Sort by date (newest first)
    const sorted = [...allMoments].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    // Get the most recent day
    const mostRecentDate = new Date(sorted[0].startTime).toDateString();
    
    // Filter to only moments from that day
    return sorted.filter(m => {
      const momentDate = new Date(m.startTime).toDateString();
      return momentDate === mostRecentDate;
    });
  };
  
  const getMomentsForDate = (allMoments: MemoryEntry[], date: string): MemoryEntry[] => {
    return allMoments.filter(m => new Date(m.startTime).toDateString() === date);
  };
  
  const generateLocalSummaries = (targetMoments: MemoryEntry[], targetDate: string) => {
    if (targetMoments.length === 0) {
      console.log(`⚠️ [MEMORIES] No moments found for ${targetDate}`);
      return;
    }
    console.log(`📝 [MEMORIES] Generating local summary for day: ${targetDate} (${targetMoments.length} moment${targetMoments.length === 1 ? '' : 's'})...`);
    
    // Generate summary for only the most recent day
    const summary = generateSummaryForDay(targetMoments, targetDate);
    
    // Replace existing summary for this date if it exists, otherwise add it
    setDailySummaries(prev => {
      const filtered = prev.filter(s => s.date !== targetDate);
      const updated = [...filtered, summary].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Save to storage
      saveDailySummaries(updated).catch(error => {
        console.error(`❌ [MEMORIES] Error saving summaries to storage:`, error);
      });
      
      return updated;
    });
    console.log(`✅ [MEMORIES] Generated local summary for ${targetDate}`);
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
      id: `summary_${date.replace(/\s+/g, '_')}`, // Generate unique ID from date
      date,
      count: dayMemories.length,
      summary,
      highlights,
      memories: dayMemories,
    };
  };
  
  const handleGenerateNow = async () => {
    // Get only moments from the most recent day
    const mostRecentDayMoments = getMostRecentDayMoments(moments);
    
    console.log(`🎯 [MEMORIES] Generate Now button pressed. Most recent day moments: ${mostRecentDayMoments.length}`);
    if (mostRecentDayMoments.length === 0) {
      console.log(`⚠️ [MEMORIES] No moments available for the most recent day`);
      Alert.alert('No Moments Yet', 'Add some moments for today, then generate a daily summary.');
      return;
    }
    
    const mostRecentDate = new Date(mostRecentDayMoments[0].startTime).toDateString();
    console.log(`📅 [MEMORIES] Will generate summary for: ${mostRecentDate}`);
    
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
        `3. IP correct? Expected: 172.16.140.220\n` +
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
      await generateDailySummaries(mostRecentDayMoments, mostRecentDate);
      console.log(`✅ [MEMORIES] Successfully generated summary for ${mostRecentDate}`);
      Alert.alert('✨ Generated!', `Created daily summary for ${formatDate(mostRecentDate)} from ${mostRecentDayMoments.length} moment${mostRecentDayMoments.length === 1 ? '' : 's'}`);
      // Summary is automatically saved to AsyncStorage by generateDailySummaries
    } catch (error) {
      console.error(`❌ [MEMORIES] Error generating summary:`, error);
      Alert.alert('Error', 'Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const getLast15Days = (): string[] => {
    const days: string[] = [];
    const today = new Date();
    for (let i = 0; i < 15; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toDateString());
    }
    return days;
  };
  
  const handleGenerateForSelectedDay = async () => {
    const targetDate = selectedDate;
    const dayMoments = getMomentsForDate(moments, targetDate);
    if (dayMoments.length === 0) {
      Alert.alert('No Moments', `No moments found for ${formatDate(targetDate)}.`);
      return;
    }
    setIsDayDropdownOpen(false);
    setIsGenerating(true);
    try {
      await generateDailySummaries(dayMoments, targetDate);
      Alert.alert('✨ Generated!', `Created daily summary for ${formatDate(targetDate)} from ${dayMoments.length} moment${dayMoments.length === 1 ? '' : 's'}`);
    } catch (error) {
      console.error(`❌ [MEMORIES] Error generating summary:`, error);
      Alert.alert('Error', 'Failed to generate summary');
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
        <GlassSurface style={styles.dayPickerCard} intensity={24}>
          <Text style={[styles.dayPickerTitle, { fontSize: dateSize }]}>
            Generate for a specific day
          </Text>
          <Text style={[styles.dayPickerSubtitle, { fontSize: countSize }]}>
            Choose any day in the last 15 days
          </Text>
          <View style={styles.dayPickerControls}>
            <TouchableOpacity
              style={styles.dayDropdown}
              onPress={() => setIsDayDropdownOpen(prev => !prev)}
            >
              <Text style={[styles.dayDropdownText, { fontSize: countSize + 1 }]}>
                {formatDate(selectedDate)}
              </Text>
              <Text style={styles.dayDropdownIcon}>{isDayDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          </View>
          {isDayDropdownOpen && (
            <View style={styles.dayDropdownList}>
              <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                {getLast15Days().map((day) => {
                  const isSelected = selectedDate === day;
                  const hasMoments = getMomentsForDate(moments, day).length > 0;
                  return (
                    <TouchableOpacity
                      key={`dropdown-${day}`}
                      style={[styles.dayDropdownItem, isSelected && styles.dayDropdownItemSelected]}
                      onPress={() => {
                        setSelectedDate(day);
                        setIsDayDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dayDropdownItemText,
                          { fontSize: countSize },
                          isSelected && styles.dayDropdownItemTextSelected,
                          !hasMoments && styles.dayDropdownItemTextMuted,
                        ]}
                      >
                        {formatDate(day)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
          <TouchableOpacity
            style={styles.dayGenerateButton}
            onPress={handleGenerateForSelectedDay}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text style={[styles.dayGenerateButtonText, { fontSize: countSize }]}>
                Generate for Selected Day
              </Text>
            )}
          </TouchableOpacity>
        </GlassSurface>
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
  dayPickerCard: {
    backgroundColor: 'rgba(52, 55, 60, 0.6)',
    borderRadius: BorderRadius.extraLarge,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayPickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dayDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.extraLarge,
    backgroundColor: Colors.cardDark,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 200,
  },
  dayDropdownText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  dayDropdownIcon: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  dayDropdownList: {
    backgroundColor: Colors.cardDark,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dayDropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dayDropdownItemSelected: {
    backgroundColor: Colors.primary,
  },
  dayDropdownItemText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dayDropdownItemTextSelected: {
    color: Colors.textPrimary,
  },
  dayDropdownItemTextMuted: {
    color: Colors.textMuted,
  },
  dayPickerTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  dayPickerSubtitle: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  dayPickerScroll: {
    marginBottom: Spacing.md,
  },
  dayOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.extraLarge,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  dayOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  dayOptionText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dayOptionTextSelected: {
    color: Colors.textPrimary,
  },
  dayOptionTextMuted: {
    color: Colors.textMuted,
  },
  dayGenerateButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.extraLarge,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  dayGenerateButtonText: {
    color: Colors.textPrimary,
    fontWeight: '700',
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
