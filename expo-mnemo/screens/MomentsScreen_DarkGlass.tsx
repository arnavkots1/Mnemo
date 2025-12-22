/**
 * MomentsScreen - Your timeline of memories
 * 
 * Beautiful glassmorphism design showing photos, audio, and locations
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
} from 'react-native';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { useMemoryContext } from '../store/MemoryContext';
import { MemoryEntry, MemoryKind } from '../types/MemoryEntry';
import { pickPhotosAndCreateMemories } from '../services/photoService';
import { getAudioUri } from '../services/audioStorageService';
import * as FileSystem from 'expo-file-system/legacy';

type FilterType = 'all' | MemoryKind;

export const MomentsScreen: React.FC = () => {
  const { memories, refreshMemories, addMemory, deleteAllMemories, isLoading } = useMemoryContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Moments screen refreshing...');
      refreshMemories();
    }, [refreshMemories])
  );

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);

  // Force refresh when memories array changes
  useEffect(() => {
    console.log(`📊 Moments: ${memories.length} memories loaded`);
  }, [memories.length]);

  // Filter memories
  const filteredMemories = React.useMemo(() => {
    if (filter === 'all') return memories;
    return memories.filter(m => m.kind === filter);
  }, [memories, filter]);

  // Group by date
  const groupedMemories = React.useMemo(() => {
    const groups: { [key: string]: MemoryEntry[] } = {};
    
    filteredMemories.forEach((memory) => {
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

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete Everything?',
      'This will delete all your memories. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await deleteAllMemories();
            Alert.alert('Done', 'All memories deleted');
          },
        },
      ]
    );
  };

  const playAudio = async (memory: MemoryEntry) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const audioUri = memory.details?.audioUri;
      if (!audioUri) {
        Alert.alert('Error', 'No audio found');
        return;
      }

      let finalUri = audioUri;
      
      if (audioUri.startsWith(FileSystem.documentDirectory || '')) {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists) {
          const permanentPath = await getAudioUri(memory.id);
          if (!permanentPath) return;
          
          const permanentInfo = await FileSystem.getInfoAsync(permanentPath);
          if (permanentInfo.exists) {
            finalUri = permanentPath;
          } else {
            Alert.alert('Error', 'Audio file not found');
            return;
          }
        }
      }

      console.log(`🎵 Playing audio: ${finalUri}`);
      setPlayingAudioId(memory.id);

      const { sound } = await Audio.Sound.createAsync(
        { uri: finalUri },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudioId(null);
          sound.unloadAsync().catch(console.error);
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
      setPlayingAudioId(null);
    }
  };

  const stopAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlayingAudioId(null);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const getMemoryIcon = (kind: MemoryKind) => {
    switch (kind) {
      case 'photo': return '📸';
      case 'emotional': return '🎙️';
      case 'context': return '📍';
      default: return '💭';
    }
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case 'happy': return '#10b981';
      case 'excited': return '#f59e0b';
      case 'sad': return '#3b82f6';
      case 'calm': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Moments</Text>
          <Text style={styles.subtitle}>{memories.length} {memories.length === 1 ? 'memory' : 'memories'}</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleRefresh}
          >
            <Text style={styles.iconButtonText}>🔄</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleImportPhotos}
          >
            <Text style={styles.iconButtonText}>📷</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'photo', label: 'Photos' },
            { key: 'emotional', label: 'Audio' },
            { key: 'context', label: 'Places' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                filter === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setFilter(tab.key as FilterType)}
            >
              <Text style={[
                styles.filterText,
                filter === tab.key && styles.filterTextActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Memories List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#64748b"
          />
        }
        decelerationRate="fast"
        scrollEventThrottle={16}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : groupedMemories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No moments yet</Text>
            <Text style={styles.emptyText}>
              Import photos or record voice notes to get started
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleImportPhotos}
            >
              <Text style={styles.emptyButtonText}>Import Photos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupedMemories.map(([date, dayMemories]) => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateHeader}>{date}</Text>
              
              {dayMemories.map((memory) => (
                <View key={memory.id} style={styles.memoryCard}>
                  {/* Memory Header */}
                  <View style={styles.memoryHeader}>
                    <View style={styles.memoryIconBadge}>
                      <Text style={styles.memoryIconText}>
                        {getMemoryIcon(memory.kind)}
                      </Text>
                    </View>
                    
                    <View style={styles.memoryHeaderContent}>
                      <Text style={styles.memoryTime}>
                        {new Date(memory.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                      
                      {memory.placeName && (
                        <View style={styles.locationBadge}>
                          <Text style={styles.locationText}>
                            📍 {memory.placeName}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Photo */}
                  {memory.kind === 'photo' && memory.details?.photoUri && (
                    <Image
                      source={{ uri: memory.details.photoUri }}
                      style={styles.memoryPhoto}
                      resizeMode="cover"
                    />
                  )}

                  {/* Content */}
                  <View style={styles.memoryContent}>
                    <Text style={styles.memorySummary}>{memory.summary}</Text>
                    
                    {memory.details?.description && (
                      <Text style={styles.memoryDescription}>
                        {memory.details.description}
                      </Text>
                    )}

                    {/* Emotion Tag */}
                    {memory.kind === 'emotional' && memory.details?.emotion && (
                      <View style={[
                        styles.emotionTag,
                        { backgroundColor: `${getEmotionColor(memory.details.emotion)}15` }
                      ]}>
                        <Text style={[
                          styles.emotionText,
                          { color: getEmotionColor(memory.details.emotion) }
                        ]}>
                          {memory.details.emotion}
                        </Text>
                      </View>
                    )}

                    {/* Audio Playback */}
                    {memory.kind === 'emotional' && memory.details?.audioUri && (
                      <TouchableOpacity
                        style={styles.audioButton}
                        onPress={() =>
                          playingAudioId === memory.id
                            ? stopAudio()
                            : playAudio(memory)
                        }
                      >
                        <Text style={styles.audioButtonIcon}>
                          {playingAudioId === memory.id ? '⏸' : '▶️'}
                        </Text>
                        <Text style={styles.audioButtonText}>
                          {playingAudioId === memory.id ? 'Stop' : 'Play Recording'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Tags */}
                    {memory.details?.tags && memory.details.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {memory.details.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <View key={idx} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Downloaded Photo Indicator */}
                    {memory.details?.isDownloadedPhoto && (
                      <View style={styles.downloadBadge}>
                        <Text style={styles.downloadBadgeText}>
                          📥 Used import time
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        {/* Delete All Button */}
        {memories.length > 0 && (
          <TouchableOpacity
            style={styles.deleteAllButton}
            onPress={handleDeleteAll}
          >
            <Text style={styles.deleteAllText}>Delete All Memories</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#1e293b',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 20,
  },
  filterSection: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: '#3b82f6',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dateSection: {
    marginTop: 24,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  memoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  memoryIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryIconText: {
    fontSize: 20,
  },
  memoryHeaderContent: {
    flex: 1,
    gap: 4,
  },
  memoryTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  memoryPhoto: {
    width: '100%',
    height: 240,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  memoryContent: {
    padding: 16,
    gap: 12,
  },
  memorySummary: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 24,
  },
  memoryDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  emotionTag: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  emotionText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  audioButtonIcon: {
    fontSize: 16,
  },
  audioButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  downloadBadge: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
  },
  downloadBadgeText: {
    fontSize: 12,
    color: '#fb923c',
    fontWeight: '600',
  },
  deleteAllButton: {
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  deleteAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
});

