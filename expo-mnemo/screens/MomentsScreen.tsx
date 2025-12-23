/**
 * MomentsScreen - Your timeline of memories
 * Soft pastel design with beautiful cards
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { useMemoryContext } from '../store/MemoryContext';
import { MemoryEntry, MemoryKind } from '../types/MemoryEntry';
import { pickPhotosAndCreateMemories } from '../services/photoService';
import { getAudioUri } from '../services/audioStorageService';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';

type FilterType = 'all' | MemoryKind;

export const MomentsScreen: React.FC = () => {
  const { memories, refreshMemories, addMemory, deleteAllMemories, isLoading } = useMemoryContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const dimensions = useWindowDimensions();
  const isSmallScreen = dimensions.width < 380;
  const isTinyScreen = dimensions.width < 350;
  const headerTitleSize = isTinyScreen ? 24 : isSmallScreen ? 26 : 28;
  const headerSubtitleSize = isTinyScreen ? 12 : isSmallScreen ? 13 : 14;
  const filterFontSize = isTinyScreen ? 11 : isSmallScreen ? 12 : 13;
  const filterHeight = isTinyScreen ? 26 : 28;
  
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Moments screen refreshing...');
      refreshMemories();
    }, [refreshMemories])
  );

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    console.log(`📊 Moments: ${memories.length} memories loaded`);
  }, [memories.length]);

  const filteredMemories = React.useMemo(() => {
    if (filter === 'all') return memories;
    return memories.filter(m => m.kind === filter);
  }, [memories, filter]);

  const groupedMemories = React.useMemo(() => {
    // Remove duplicates by ID first
    const uniqueMemories = filteredMemories.reduce((acc: MemoryEntry[], memory) => {
      if (!acc.some(m => m.id === memory.id)) {
        acc.push(memory);
      }
      return acc;
    }, []);
    
    const groups: { [key: string]: MemoryEntry[] } = {};
    
    uniqueMemories.forEach((memory) => {
      const date = new Date(memory.startTime);
      const dateKey = date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(memory);
    });
    
    return Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].startTime);
      const dateB = new Date(b[1][0].startTime);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredMemories]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMemories();
      await new Promise(resolve => setTimeout(resolve, 200));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImportPhotos = async () => {
    try {
      const memories = await pickPhotosAndCreateMemories();
      
      if (memories.length > 0) {
        let successCount = 0;
        console.log(`📝 Importing ${memories.length} photos...`);
        
        for (const memory of memories) {
          try {
            await addMemory(memory);
            successCount++;
          } catch (error) {
            console.error('❌ Error adding memory:', error);
          }
        }
        
        console.log(`📝 Import complete: ${successCount}/${memories.length}`);
        
        await refreshMemories();
        setTimeout(async () => {
          await refreshMemories();
        }, 500);
        
        Alert.alert('Success', `Imported ${successCount} photo${successCount > 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error('Error importing photos:', error);
      Alert.alert('Import Error', 'Failed to import photos. Please try again.');
    }
  };

  const playAudio = async (memory: MemoryEntry) => {
    try {
      if (playingAudioId === memory.id) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setPlayingAudioId(null);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (!memory.details?.audioPath) return;
      
      const permanentPath = await getAudioUri(memory.details.audioPath);
      if (!permanentPath) return;

      const fileInfo = await FileSystem.getInfoAsync(permanentPath);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Audio file not found');
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: permanentPath },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      setPlayingAudioId(memory.id);

      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setPlayingAudioId(null);
          sound.unloadAsync().catch(console.error);
        }
      });

    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Could not play audio');
    }
  };

  const renderMemoryCard = (memory: MemoryEntry) => {
    const time = new Date(memory.startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return (
      <View key={memory.id} style={styles.memoryCard}>
        {/* Memory Type Icon */}
        <View style={styles.memoryIconBadge}>
          <Text style={styles.memoryIcon}>
            {memory.kind === 'photo' ? '📸' : 
             memory.kind === 'emotional' ? '🎙️' : 
             memory.kind === 'context' ? '📍' : '✨'}
          </Text>
        </View>

        {/* Memory Content */}
        <View style={styles.memoryContent}>
          {/* Header */}
          <View style={styles.memoryHeader}>
            <Text style={styles.memoryTitle} numberOfLines={2}>
              {memory.summary}
            </Text>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{time}</Text>
            </View>
          </View>

          {/* Description */}
          {memory.details?.description && (
            <Text style={styles.memoryDescription} numberOfLines={2}>
              {memory.details.description}
            </Text>
          )}

          {/* Photo */}
          {memory.kind === 'photo' && memory.details?.imagePath && (
            <Image
              source={{ uri: memory.details.imagePath, cache: 'force-cache' }}
              style={styles.memoryImage}
              resizeMode="cover"
            />
          )}

          {/* Audio Player */}
          {memory.kind === 'emotional' && memory.details?.audioPath && (
            <TouchableOpacity 
              style={styles.audioPlayer}
              onPress={() => playAudio(memory)}
            >
              <View style={styles.audioIcon}>
                <Text style={styles.audioIconText}>
                  {playingAudioId === memory.id ? '⏸' : '▶'}
                </Text>
              </View>
              <View style={styles.audioInfo}>
                <Text style={styles.audioLabel}>
                  {playingAudioId === memory.id ? 'Playing...' : 'Tap to play'}
                </Text>
                {memory.details.emotion && (
                  <Text style={styles.emotionText}>
                    {memory.details.emotion}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Location */}
          {(memory.placeName || memory.details?.locationName) && (
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>📍 {memory.placeName || memory.details?.locationName}</Text>
            </View>
          )}

          {/* Tags */}
          {memory.details?.tags && memory.details.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {memory.details.tags.slice(0, 3).map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>Your Moments</Text>
          <Text style={[styles.headerSubtitle, { fontSize: headerSubtitleSize }]}>
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.importButton}
            onPress={handleImportPhotos}
          >
            <Text style={styles.importButtonText}>Import Photos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScrollView}
      >
        <TouchableOpacity
          style={[styles.filterPill, { height: filterHeight }, filter === 'all' && styles.filterPillActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, { fontSize: filterFontSize }, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, { height: filterHeight }, filter === 'photo' && styles.filterPillActive]}
          onPress={() => setFilter('photo')}
        >
          <Text style={[styles.filterText, { fontSize: filterFontSize }, filter === 'photo' && styles.filterTextActive]}>
            Photos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, { height: filterHeight }, filter === 'emotional' && styles.filterPillActive]}
          onPress={() => setFilter('emotional')}
        >
          <Text style={[styles.filterText, { fontSize: filterFontSize }, filter === 'emotional' && styles.filterTextActive]}>
            Audio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, { height: filterHeight }, filter === 'context' && styles.filterPillActive]}
          onPress={() => setFilter('context')}
        >
          <Text style={[styles.filterText, { fontSize: filterFontSize }, filter === 'context' && styles.filterTextActive]}>
            Places
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Memories List */}
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
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading memories...</Text>
          </View>
        ) : groupedMemories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>📸</Text>
            </View>
            <Text style={styles.emptyTitle}>No moments yet</Text>
            <Text style={styles.emptyText}>
              Start capturing memories by importing photos or recording voice notes
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleImportPhotos}
            >
              <Text style={styles.emptyButtonText}>Import Your First Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupedMemories.map(([date, dayMemories]) => (
            <View key={date} style={styles.dayGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {dayMemories.map(renderMemoryCard)}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
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
    paddingTop: 50, // proper space for notch/status bar
    paddingBottom: Spacing.md, // more breathing room
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardLight,
    borderBottomLeftRadius: BorderRadius.large,
    borderBottomRightRadius: BorderRadius.large,
    ...Shadows.small,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
  },
  importButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    ...Shadows.small,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  filtersScrollView: {
    marginBottom: 0, // NO margin below filters ScrollView
    maxHeight: 50, // Fixed height to prevent expansion
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 0, // NO bottom padding - content starts immediately
    gap: Spacing.sm, // more space between filter buttons
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.cardLight,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 0, // NO gap - first date starts immediately below filters
    paddingBottom: Spacing.lg,
    flexGrow: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: Spacing.lg,
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
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.primary,
    ...Shadows.medium,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayGroup: {
    marginBottom: Spacing.md,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 0, // NO top margin - starts immediately
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  memoryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardLight,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  memoryIconBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  memoryIcon: {
    fontSize: 22,
  },
  memoryContent: {
    flex: 1,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  memoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
    lineHeight: 22,
  },
  timeBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  memoryDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  memoryImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.sm,
    backgroundColor: Colors.background,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.medium,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  audioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  audioIconText: {
    fontSize: 16,
  },
  audioInfo: {
    flex: 1,
  },
  audioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emotionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  locationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    marginTop: Spacing.sm,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

