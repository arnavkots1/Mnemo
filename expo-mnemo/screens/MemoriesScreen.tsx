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
import { API_CONFIG } from '../config/apiConfig';

interface DailySummary {
  date: string;
  count: number;
  summary: string;
  highlights: string[];
  memories: MemoryEntry[];
}

export const MemoriesScreen: React.FC = () => {
  const { memories } = useMemoryContext();
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const dimensions = useWindowDimensions();
  
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
        console.log('🌙 End of day - auto-generating memory summary');
        generateDailySummaries();
        // TODO: Save to AsyncStorage for persistence
      }
    };
    
    // Check every minute
    const interval = setInterval(checkEndOfDay, 60000);
    return () => clearInterval(interval);
  }, [memories]);
  
  const generateDailySummaries = async () => {
    try {
      console.log('🚀 [Memories] Calling backend API for daily summaries...');
      
      // Call backend API for AI-powered summaries
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for Gemini
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/memory/daily-summaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memories }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ [Memories] Backend generated ${result.summaries?.length || 0} summaries`);
      
      // Convert backend format to local format
      const summaries: DailySummary[] = (result.summaries || []).map((s: any) => ({
        date: s.date,
        count: s.count,
        summary: s.summary,
        highlights: s.highlights || [],
        memories: memories.filter(m => {
          const memoryDate = new Date(m.startTime).toDateString();
          return memoryDate === s.date;
        }),
      }));
      
      setDailySummaries(summaries);
    } catch (error) {
      console.error('❌ [Memories] Error calling backend, using local fallback:', error);
      // Fallback to local generation
      generateLocalSummaries();
    }
  };
  
  const generateLocalSummaries = () => {
    // Group memories by day
    const grouped = new Map<string, MemoryEntry[]>();
    
    memories.forEach(memory => {
      const date = new Date(memory.startTime).toDateString();
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(memory);
    });
    
    // Generate summaries for each day
    const summaries: DailySummary[] = [];
    
    for (const [date, dayMemories] of grouped.entries()) {
      const summary = generateSummaryForDay(dayMemories, date);
      summaries.push(summary);
    }
    
    // Sort by date (newest first)
    summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setDailySummaries(summaries);
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
    if (memories.length === 0) {
      Alert.alert('No Moments Yet', 'Add some moments first, then generate memories from them.');
      return;
    }
    
    setIsGenerating(true);
    try {
      await generateDailySummaries();
      Alert.alert('✨ Generated!', `Created summaries from ${memories.length} moment${memories.length === 1 ? '' : 's'}`);
      // TODO: Save to AsyncStorage for persistence
    } catch (error) {
      Alert.alert('Error', 'Failed to generate summaries');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={[styles.generateButtonText, { fontSize: countSize }]}>
              Generate Now
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
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
            <View key={index} style={styles.summaryCard}>
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
              
              <Text style={[styles.summaryText, { fontSize: summarySize }]}>
                {summary.summary}
              </Text>
              
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
            </View>
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
    backgroundColor: Colors.cardLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    color: Colors.text,
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
    borderRadius: BorderRadius.medium,
    minWidth: 80,
    alignItems: 'center',
    ...Shadows.small,
  },
  generateButtonText: {
    color: Colors.white,
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
    color: Colors.text,
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
    backgroundColor: Colors.cardLight,
    borderRadius: BorderRadius.large,
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
    color: Colors.text,
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
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
    color: Colors.primary,
    fontWeight: '600',
  },
  summaryText: {
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
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
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  highlightText: {
    flex: 1,
    color: Colors.text,
    lineHeight: 20,
  },
});

