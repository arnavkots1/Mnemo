/**
 * TodayScreen - Timeline of all memories for today
 * Soft pastel design
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useMemoryContext } from '../store/MemoryContext';
import { MemoryEntry } from '../types/MemoryEntry';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';

export const TodayScreen: React.FC = () => {
  const { memories, refreshMemories } = useMemoryContext();
  const [todayMemories, setTodayMemories] = useState<MemoryEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loadTodayMemories = useCallback(() => {
    const today = new Date();
    const filtered = memories.filter(m => {
      const memoryDate = new Date(m.startTime);
      return memoryDate.toDateString() === today.toDateString();
    });
    
    // Sort by time (earliest first)
    filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    setTodayMemories(filtered);
  }, [memories]);
  
  useEffect(() => {
    loadTodayMemories();
    
    // Refresh every minute
    const interval = setInterval(loadTodayMemories, 60000);
    return () => clearInterval(interval);
  }, [loadTodayMemories]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMemories();
    loadTodayMemories();
    setIsRefreshing(false);
  };
  
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  const getIcon = (kind: string): string => {
    switch (kind) {
      case 'context_log': return '📍';
      case 'audio': return '🎙️';
      case 'photo': return '📸';
      case 'emotional': return '💭';
      default: return '✨';
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString([], { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{todayMemories.length}</Text>
            <Text style={styles.statLabel}>memories</Text>
          </View>
        </View>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {todayMemories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>📅</Text>
            </View>
            <Text style={styles.emptyTitle}>No memories yet today</Text>
            <Text style={styles.emptyText}>
              Start your day by capturing a moment. Record a voice note, import a photo, or let the app track your journey.
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {todayMemories.map((memory, index) => (
              <View key={memory.id} style={styles.timelineItem}>
                {/* Time Marker */}
                <View style={styles.timelineLeft}>
                  <Text style={styles.timeText}>{formatTime(memory.startTime)}</Text>
                  <View style={styles.timelineDot} />
                  {index < todayMemories.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                
                {/* Memory Card */}
                <View style={styles.memoryCard}>
                  <View style={styles.memoryHeader}>
                    <View style={styles.memoryIconBadge}>
                      <Text style={styles.memoryIcon}>{getIcon(memory.kind)}</Text>
                    </View>
                    <View style={styles.memoryContent}>
                      <Text style={styles.memoryTitle} numberOfLines={2}>
                        {memory.summary}
                      </Text>
                      {memory.description && (
                        <Text style={styles.memoryDescription} numberOfLines={2}>
                          {memory.description}
                        </Text>
                      )}
                      {memory.details?.locationName && (
                        <View style={styles.locationBadge}>
                          <Text style={styles.locationText}>
                            📍 {memory.details.locationName}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Building your day</Text>
          <Text style={styles.infoText}>
            Mnemo automatically captures your daily journey through photos, voice notes, and places you visit.
          </Text>
        </View>
        
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardLight,
    borderBottomLeftRadius: BorderRadius.large,
    borderBottomRightRadius: BorderRadius.large,
    ...Shadows.small,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  date: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  statsContainer: {
    alignItems: 'center',
  },
  statBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyIconText: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  timeline: {
    paddingTop: Spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  timelineLeft: {
    width: 80,
    alignItems: 'flex-end',
    paddingRight: Spacing.md,
    paddingTop: Spacing.xs,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginRight: -6,
    ...Shadows.small,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: Spacing.xs,
    marginRight: -1,
  },
  memoryCard: {
    flex: 1,
    backgroundColor: Colors.cardLight,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },
  memoryHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  memoryIconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryIcon: {
    fontSize: 20,
  },
  memoryContent: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  memoryDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  locationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    marginTop: Spacing.xs,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.secondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.lg,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});


