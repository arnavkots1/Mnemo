/**
 * MomentsScreen - Calendar view with filtered memory types
 * 
 * Shows memories organized by type (Images, Locations, Audio, All) and by date.
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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useMemoryContext } from '../store/MemoryContext';
import { MemoryEntry, MemoryKind } from '../types/MemoryEntry';
import { pickPhotosAndCreateMemories } from '../services/photoService';
import { getAudioFilePath } from '../services/audioStorageService';
import * as FileSystem from 'expo-file-system/legacy';

type FilterType = 'all' | MemoryKind;

export const MomentsScreen: React.FC = () => {
  const { memories, refreshMemories, addMemory, isLoading } = useMemoryContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Refresh memories when screen comes into focus
  useFocusEffect(
    useCallback(() => {
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

  // Filter memories by selected type
  const filteredMemories = React.useMemo(() => {
    if (filter === 'all') {
      return memories;
    }
    return memories.filter(m => m.kind === filter);
  }, [memories, filter]);

  // Play audio recording
  const playAudio = async (memory: MemoryEntry) => {
    try {
      // Stop any currently playing audio
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const audioUri = memory.details?.audioUri;
      if (!audioUri) {
        Alert.alert('Error', 'No audio recording found for this memory.');
        return;
      }

      // Check if file exists (handle both temp and permanent URIs)
      let finalUri = audioUri;
      
      // If it's a permanent path, check if file exists
      if (audioUri.startsWith(FileSystem.documentDirectory || '')) {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists) {
          // Try to get the permanent path
          const permanentPath = getAudioFilePath(memory.id);
          const permanentInfo = await FileSystem.getInfoAsync(permanentPath);
          if (permanentInfo.exists) {
            finalUri = permanentPath;
          } else {
            Alert.alert('Error', 'Audio file not found.');
            return;
          }
        }
      }

      setPlayingAudioId(memory.id);

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Load and play audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: finalUri },
        { shouldPlay: true }
      );

      soundRef.current = sound;

      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            // Playback finished
            setPlayingAudioId(null);
            sound.unloadAsync().catch(console.error);
            soundRef.current = null;
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio recording.');
      setPlayingAudioId(null);
    }
  };

  // Stop audio playback
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
  
  // Group filtered memories by date
  const groupedMemories = React.useMemo(() => {
    const groups: { [key: string]: MemoryEntry[] } = {};
    
    filteredMemories.forEach((memory) => {
      const date = new Date(memory.startTime);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(memory);
    });
    
    // Sort memories within each day (newest first)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    });
    
    // Sort days (newest first)
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((dateKey) => ({
        date: dateKey,
        memories: groups[dateKey],
      }));
  }, [filteredMemories]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMemories();
    setIsRefreshing(false);
  };
  
  const handleImportPhotos = async () => {
    try {
      const memories = await pickPhotosAndCreateMemories();
      
      if (memories.length > 0) {
        let successCount = 0;
        for (const memory of memories) {
          try {
            await addMemory(memory);
            successCount++;
          } catch (error) {
            console.error('Error adding memory:', error);
          }
        }
        
        if (successCount > 0) {
          await refreshMemories();
          Alert.alert(
            'Photos Imported',
            `Successfully imported ${successCount} photo${successCount > 1 ? 's' : ''}.`
          );
        } else {
          Alert.alert('Error', 'Failed to import photos. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Error importing photos:', error);
      const errorMessage = error.message || 'Failed to import photos.';
      if (!errorMessage.includes('canceled') && !errorMessage.includes('permission')) {
        Alert.alert('Error', errorMessage + ' Please check permissions in Settings.');
      }
    }
  };
  
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      } else {
        return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
      }
    }
  };
  
  const getKindTag = (kind: string): string => {
    switch (kind) {
      case 'context': return '📍 Context';
      case 'emotional': return '💭 Emotional';
      case 'photo': return '📷 Photo';
      default: return kind;
    }
  };
  
  const getFilterCount = (kind: FilterType): number => {
    if (kind === 'all') return memories.length;
    return memories.filter(m => m.kind === kind).length;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Moments</Text>
        <TouchableOpacity
          style={styles.importButton}
          onPress={handleImportPhotos}
        >
          <Text style={styles.importButtonText}>📷 Import Photos</Text>
        </TouchableOpacity>
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All ({getFilterCount('all')})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'photo' && styles.filterTabActive]}
            onPress={() => setFilter('photo')}
          >
            <Text style={[styles.filterTabText, filter === 'photo' && styles.filterTabTextActive]}>
              📷 Images ({getFilterCount('photo')})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'context' && styles.filterTabActive]}
            onPress={() => setFilter('context')}
          >
            <Text style={[styles.filterTabText, filter === 'context' && styles.filterTabTextActive]}>
              📍 Locations ({getFilterCount('context')})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'emotional' && styles.filterTabActive]}
            onPress={() => setFilter('emotional')}
          >
            <Text style={[styles.filterTabText, filter === 'emotional' && styles.filterTabTextActive]}>
              🎤 Audio ({getFilterCount('emotional')})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : groupedMemories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No memories yet' : `No ${filter} memories yet`}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'photo' && 'Import photos to create image memories'}
              {filter === 'context' && 'Enable passive context logging in Settings'}
              {filter === 'emotional' && 'Start a capture session to record audio memories'}
              {filter === 'all' && 'Start a capture session, import photos, or enable passive context logging'}
            </Text>
          </View>
        ) : (
          groupedMemories.map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{formatDateHeader(group.date)}</Text>
                <Text style={styles.dateCount}>{group.memories.length} moment{group.memories.length !== 1 ? 's' : ''}</Text>
              </View>
              
              {group.memories.map((memory) => (
                <View key={memory.id} style={styles.memoryItem}>
                  {memory.kind === 'photo' && memory.details?.uri ? (
                    <>
                      <Image
                        source={{ uri: memory.details.uri }}
                        style={styles.photoThumbnail}
                        resizeMode="cover"
                      />
                      <View style={styles.memoryContent}>
                        <View style={styles.memoryHeader}>
                          <Text style={styles.memoryTime}>{formatTime(memory.startTime)}</Text>
                          <Text style={styles.memoryTag}>{getKindTag(memory.kind)}</Text>
                        </View>
                        <Text style={styles.memorySummary}>{memory.summary}</Text>
                        {memory.details?.description && (
                          <Text style={styles.memoryDescription}>{memory.details.description}</Text>
                        )}
                        {memory.placeName && (
                          <Text style={styles.memoryPlace}>{memory.placeName}</Text>
                        )}
                      </View>
                    </>
                  ) : memory.kind === 'emotional' ? (
                    <>
                      <View style={styles.iconContainer}>
                        <Text style={styles.memoryIcon}>🎤</Text>
                      </View>
                      <View style={styles.memoryContent}>
                        <View style={styles.memoryHeader}>
                          <Text style={styles.memoryTime}>{formatTime(memory.startTime)}</Text>
                          <Text style={styles.memoryTag}>{getKindTag(memory.kind)}</Text>
                        </View>
                        <Text style={styles.memorySummary}>{memory.summary}</Text>
                        {memory.details?.emotion && (
                          <Text style={styles.emotionLabel}>
                            {memory.details.emotion.charAt(0).toUpperCase() + memory.details.emotion.slice(1)}
                          </Text>
                        )}
                        {memory.details?.audioUri && (
                          <TouchableOpacity
                            style={styles.playButton}
                            onPress={() => {
                              if (playingAudioId === memory.id) {
                                stopAudio();
                              } else {
                                playAudio(memory);
                              }
                            }}
                          >
                            {playingAudioId === memory.id ? (
                              <>
                                <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />
                                <Text style={styles.playButtonText}>Playing...</Text>
                                <TouchableOpacity
                                  onPress={stopAudio}
                                  style={{ marginLeft: 8 }}
                                >
                                  <Ionicons name="stop" size={20} color="#007AFF" />
                                </TouchableOpacity>
                              </>
                            ) : (
                              <>
                                <Ionicons name="play" size={20} color="#007AFF" />
                                <Text style={styles.playButtonText}>Play Recording</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                        {memory.placeName && (
                          <Text style={styles.memoryPlace}>{memory.placeName}</Text>
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.iconContainer}>
                        <Text style={styles.memoryIcon}>📍</Text>
                      </View>
                      <View style={styles.memoryContent}>
                        <View style={styles.memoryHeader}>
                          <Text style={styles.memoryTime}>{formatTime(memory.startTime)}</Text>
                          <Text style={styles.memoryTag}>{getKindTag(memory.kind)}</Text>
                        </View>
                        <Text style={styles.memorySummary}>{memory.summary}</Text>
                        {memory.placeName && (
                          <Text style={styles.memoryPlace}>{memory.placeName}</Text>
                        )}
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  importButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  dateGroup: {
    marginTop: 24,
    marginBottom: 8,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  dateCount: {
    fontSize: 14,
    color: '#666',
  },
  memoryItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  memoryIcon: {
    fontSize: 24,
  },
  memoryContent: {
    flex: 1,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  memoryTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  memoryTag: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  memorySummary: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
    fontWeight: '500',
  },
  memoryDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  emotionLabel: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  audioLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  playButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  memoryPlace: {
    fontSize: 13,
    color: '#666',
  },
});
