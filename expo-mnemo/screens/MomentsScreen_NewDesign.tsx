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
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useMemoryContext } from '../store/MemoryContext';
import { MemoryEntry, MemoryKind } from '../types/MemoryEntry';
import { pickPhotosAndCreateMemories } from '../services/photoService';
import { getAudioUri } from '../services/audioStorageService';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';
import { GlassSurface } from '../components/GlassSurface';

type FilterType = 'all' | MemoryKind | 'audio' | 'context_log'; // Support legacy filter names

export const MomentsScreen: React.FC = () => {
  const { memories, refreshMemories, addMemory, deleteAllMemories, deleteMemory, isLoading } = useMemoryContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ placeName: string; latitude: number; longitude: number } | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);
  const dimensions = useWindowDimensions();
  const isCompact = dimensions.width < 360;
  const headerTitleSize = isCompact ? 22 : 28;
  const headerSubtitleSize = isCompact ? 12 : 14;
  const buttonTextSize = isCompact ? 12 : 14;
  const emptyTitleSize = isCompact ? 18 : 22;
  const emptyTextSize = isCompact ? 13 : 15;
  const dateHeaderSize = isCompact ? 14 : 16;
  
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [MOMENTS] Screen focused - refreshing moments...');
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
    console.log(`📊 [MOMENTS] State updated: ${memories.length} moment${memories.length === 1 ? '' : 's'} loaded`);
    console.log(`📊 [MOMENTS] isLoading=${isLoading}, filter="${filter}"`);
    if (memories.length > 0) {
      console.log(`📊 [MOMENTS] Sample moment:`, {
        id: memories[0].id,
        kind: memories[0].kind,
        summary: memories[0].summary,
        startTime: memories[0].startTime,
      });
    } else {
      console.log(`⚠️ [MOMENTS] No moments found in state`);
    }
  }, [memories.length, isLoading, filter]);

  const filteredMemories = React.useMemo(() => {
    let result;
    if (filter === 'all') {
      result = memories;
    } else if (filter === 'audio') {
      result = memories.filter(m => m.kind === 'emotional');
    } else if (filter === 'context_log') {
      result = memories.filter(m => m.kind === 'context');
    } else {
      result = memories.filter(m => m.kind === filter);
    }
    console.log(`🔍 [MOMENTS] Filter: "${filter}", Total moments: ${memories.length}, Filtered: ${result.length}`);
    return result;
  }, [memories, filter]);

  // Check location permissions and get current location when Places filter is active
  useEffect(() => {
    const checkLocation = async () => {
      if (filter === 'context_log' && filteredMemories.length === 0) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          const hasPermission = status === 'granted';
          setLocationPermissionGranted(hasPermission);
          
          if (hasPermission) {
            try {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              
              // Reverse geocode to get place name
              try {
                const results = await Location.reverseGeocodeAsync({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                });
                
                if (results.length > 0) {
                  const result = results[0];
                  const parts: string[] = [];
                  if (result.name) parts.push(result.name);
                  if (result.street) parts.push(result.street);
                  if (result.city) parts.push(result.city);
                  if (result.region) parts.push(result.region);
                  
                  const placeName = parts.length > 0 ? parts.join(', ') : 'Current location';
                  setCurrentLocation({
                    placeName,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  });
                } else {
                  setCurrentLocation({
                    placeName: 'Current location',
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  });
                }
              } catch (error) {
                // If reverse geocoding fails, still show coordinates
                setCurrentLocation({
                  placeName: 'Current location',
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                });
              }
            } catch (error) {
              // Location unavailable (e.g., in emulator)
              setCurrentLocation(null);
            }
          } else {
            setCurrentLocation(null);
          }
        } catch (error) {
          setLocationPermissionGranted(false);
          setCurrentLocation(null);
        }
      } else {
        // Reset when filter changes or memories exist
        setCurrentLocation(null);
        setLocationPermissionGranted(null);
      }
    };
    
    checkLocation();
  }, [filter, filteredMemories.length]);

  const groupedMemories = React.useMemo(() => {
    const groups: { [key: string]: MemoryEntry[] } = {};
    
    console.log(`📦 [MOMENTS] Grouping ${filteredMemories.length} filtered moment${filteredMemories.length === 1 ? '' : 's'}...`);
    
    filteredMemories.forEach((moment) => {
      try {
        const date = new Date(moment.startTime);
        if (isNaN(date.getTime())) {
          console.error(`❌ [MOMENTS] Invalid date for moment ${moment.id}: ${moment.startTime}`);
          return;
        }
        const dateKey = date.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(moment);
        console.log(`📅 [MOMENTS] Added moment "${moment.summary}" to group: ${dateKey}`);
      } catch (error) {
        console.error(`❌ [MOMENTS] Error grouping moment ${moment.id}:`, error);
      }
    });
    
    const result = Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].startTime);
      const dateB = new Date(b[1][0].startTime);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`✅ [MOMENTS] Grouped into ${result.length} day group${result.length === 1 ? '' : 's'}`);
    result.forEach(([date, moments]) => {
      console.log(`   📅 ${date}: ${moments.length} moment${moments.length === 1 ? '' : 's'}`);
    });
    return result;
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

  const handleDeleteMemory = (moment: MemoryEntry) => {
    console.log(`🗑️ [MOMENTS] Delete button pressed for moment: ${moment.id} - "${moment.summary}"`);
    Alert.alert(
      'Delete Moment',
      `Are you sure you want to delete "${moment.summary}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log(`❌ [MOMENTS] Delete cancelled for moment: ${moment.id}`);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🗑️ [MOMENTS] Deleting moment: ${moment.id} - "${moment.summary}"`);
              await deleteMemory(moment.id);
              console.log(`✅ [MOMENTS] Moment deleted successfully: ${moment.id}`);
              
              // Stop audio if this moment was playing
              if (playingAudioId === moment.id && soundRef.current) {
                console.log(`⏹️ [MOMENTS] Stopping audio playback for deleted moment`);
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
                setPlayingAudioId(null);
              }
              
              // Refresh to update the count
              await refreshMemories();
              console.log(`🔄 [MOMENTS] Refreshed moments list after deletion`);
            } catch (error) {
              console.error(`❌ [MOMENTS] Error deleting moment ${moment.id}:`, error);
              Alert.alert('Error', 'Failed to delete moment');
            }
          },
        },
      ]
    );
  };

  const playAudio = async (moment: MemoryEntry) => {
    try {
      if (playingAudioId === moment.id) {
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

      if (!moment.details?.audioPath) return;
      
      const permanentPath = await getAudioUri(moment.details.audioPath);
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
      setPlayingAudioId(moment.id);

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

  const renderMemoryCard = (moment: MemoryEntry) => {
    console.log(`🎨 [MOMENTS] Rendering moment card: ${moment.id} - "${moment.summary}"`);
    const time = new Date(moment.startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return (
      <GlassSurface key={moment.id} style={styles.memoryCard} intensity={26}>
        {/* Memory Type Icon */}
        <View style={styles.memoryIconBadge}>
          <Text style={styles.memoryIcon}>
            {moment.kind === 'photo' ? '📸' : 
             moment.kind === 'emotional' ? '🎙️' : 
             moment.kind === 'context' ? '📍' : '✨'}
          </Text>
        </View>

        {/* Moment Content */}
        <View style={styles.memoryContent}>
          {/* Header */}
          <View style={styles.memoryHeader}>
            <View style={styles.memoryTitleContainer}>
              <Text style={styles.memoryTitle} numberOfLines={2}>
                {moment.summary}
              </Text>
            </View>
            <View style={styles.memoryHeaderActions}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{time}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteMemory(moment)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          {moment.details?.description && (
            <Text style={styles.memoryDescription} numberOfLines={2}>
              {String(moment.details.description)}
            </Text>
          )}

          {/* Photo */}
          {moment.kind === 'photo' && moment.details?.imagePath && (
            <Image
              source={{ uri: moment.details.imagePath, cache: 'force-cache' }}
              style={styles.memoryImage}
              resizeMode="cover"
            />
          )}

          {/* Audio Player */}
          {moment.kind === 'emotional' && moment.details?.audioPath && (
            <TouchableOpacity 
              style={styles.audioPlayer}
              onPress={() => playAudio(moment)}
            >
              <View style={styles.audioIcon}>
                <Text style={styles.audioIconText}>
                  {playingAudioId === moment.id ? '⏸' : '▶'}
                </Text>
              </View>
              <View style={styles.audioInfo}>
                <Text style={styles.audioLabel}>
                  {playingAudioId === moment.id ? 'Playing...' : 'Tap to play'}
                </Text>
                {moment.details.emotion && (
                  <Text style={styles.emotionText}>
                    {moment.details.emotion}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Transcript */}
          {moment.details?.transcript && (
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptLabel}>Transcript:</Text>
              <Text style={styles.transcriptText}>{moment.details.transcript}</Text>
            </View>
          )}

          {/* Location */}
          {moment.details?.locationName && (
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>📍 {moment.details.locationName}</Text>
            </View>
          )}

          {/* Tags */}
          {moment.details?.tags && moment.details.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {moment.details.tags.slice(0, 3).map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </GlassSurface>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <GlassSurface style={[styles.header, isCompact && styles.headerStacked]} intensity={28}>
        <View>
          <Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>Your Moments</Text>
          <Text style={[styles.headerSubtitle, { fontSize: headerSubtitleSize }]}>
            {filteredMemories.length} {filteredMemories.length === 1 ? 'moment' : 'moments'}
            {filter !== 'all' && ` (${memories.length} total)`}
          </Text>
        </View>
        <View style={[styles.headerActions, isCompact && styles.headerActionsStacked]}>
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
            <Text style={[styles.importButtonText, { fontSize: buttonTextSize }]}>Import Photos</Text>
          </TouchableOpacity>
        </View>
      </GlassSurface>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScrollView}
      >
        <TouchableOpacity
          style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'photo' && styles.filterPillActive]}
          onPress={() => setFilter('photo')}
        >
          <Text style={[styles.filterText, filter === 'photo' && styles.filterTextActive]}>
            Photos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'audio' && styles.filterPillActive]}
          onPress={() => setFilter('audio')}
        >
          <Text style={[styles.filterText, filter === 'audio' && styles.filterTextActive]}>
            Audio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'context_log' && styles.filterPillActive]}
          onPress={() => setFilter('context_log')}
        >
          <Text style={[styles.filterText, filter === 'context_log' && styles.filterTextActive]}>
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
        {(() => {
          if (isLoading) {
            return (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading memories...</Text>
              </View>
            );
          }
          
          if (groupedMemories.length === 0) {
            console.log(`⚠️ [MOMENTS] No grouped moments to display. Filter: "${filter}", Filtered: ${filteredMemories.length}, Total: ${memories.length}, isLoading: ${isLoading}`);
            return (
          <View style={styles.emptyContainer}>
            {filter === 'context_log' ? (
              <>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>📍</Text>
                </View>
                {locationPermissionGranted === true && currentLocation ? (
                  <>
                <Text style={[styles.emptyTitle, { fontSize: emptyTitleSize }]}>Location Tracking Active</Text>
                <Text style={[styles.emptyText, { fontSize: emptyTextSize }]}>
                  Currently at: {currentLocation.placeName}
                </Text>
                <Text style={styles.emptySubtext}>
                  Places will appear here when you move to a new location (500m+ away)
                </Text>
                  </>
                ) : locationPermissionGranted === false ? (
                  <>
                <Text style={[styles.emptyTitle, { fontSize: emptyTitleSize }]}>Location Permission Needed</Text>
                <Text style={[styles.emptyText, { fontSize: emptyTextSize }]}>
                  Enable location access in Settings to track places automatically
                </Text>
                  </>
                ) : (
                  <>
                <Text style={[styles.emptyTitle, { fontSize: emptyTitleSize }]}>Checking Location...</Text>
                <Text style={[styles.emptyText, { fontSize: emptyTextSize }]}>
                  Please wait while we check your location permissions
                </Text>
                  </>
                )}
              </>
            ) : filter === 'audio' ? (
              <>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>🎤</Text>
                </View>
              <Text style={[styles.emptyTitle, { fontSize: emptyTitleSize }]}>No voice moments yet</Text>
              <Text style={[styles.emptyText, { fontSize: emptyTextSize }]}>
                Record voice notes from the Home screen to capture audio moments
              </Text>
              </>
            ) : filter === 'photo' ? (
              <>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>📸</Text>
                </View>
              <Text style={[styles.emptyTitle, { fontSize: emptyTitleSize }]}>No photos yet</Text>
              <Text style={[styles.emptyText, { fontSize: emptyTextSize }]}>
                Import photos to create visual memories
              </Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={handleImportPhotos}
                >
                  <Text style={styles.emptyButtonText}>Import Your First Photo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>📸</Text>
                </View>
              <Text style={[styles.emptyTitle, { fontSize: emptyTitleSize }]}>No moments yet</Text>
              <Text style={[styles.emptyText, { fontSize: emptyTextSize }]}>
                Start capturing memories by importing photos or recording voice notes
              </Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={handleImportPhotos}
                >
                  <Text style={styles.emptyButtonText}>Import Your First Photo</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
            );
          }
          
          console.log(`✅ [MOMENTS] Rendering ${groupedMemories.length} day group${groupedMemories.length === 1 ? '' : 's'} with ${filteredMemories.length} moment${filteredMemories.length === 1 ? '' : 's'}`);
          groupedMemories.forEach(([date, dayMoments]) => {
            console.log(`   🎨 [MOMENTS] Rendering group "${date}" with ${dayMoments.length} moment${dayMoments.length === 1 ? '' : 's'}`);
          });
          return (
            <>
              {groupedMemories.map(([date, dayMoments]) => {
                console.log(`🎨 [MOMENTS] Rendering day group "${date}" with ${dayMoments.length} moment${dayMoments.length === 1 ? '' : 's'}`);
                return (
                  <View key={date} style={styles.dayGroup}>
                    <Text style={[styles.dateHeader, { fontSize: dateHeaderSize }]}>{date}</Text>
                    {dayMoments.map((moment) => {
                      console.log(`   🎨 [MOMENTS] Rendering moment: ${moment.id} - "${moment.summary}"`);
                      return renderMemoryCard(moment);
                    })}
                  </View>
                );
              })}
            </>
          );
        })()}

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
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardDark,
    borderBottomLeftRadius: BorderRadius.large,
    borderBottomRightRadius: BorderRadius.large,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.small,
  },
  headerStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  headerActionsStacked: {
    width: '100%',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.cardLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
  },
  importButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.extraLarge,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    ...Shadows.small,
  },
  importButtonText: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  filtersScrollView: {
    marginBottom: 0,
    maxHeight: 50,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: 0,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.extraLarge,
    backgroundColor: Colors.cardDark,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: Colors.cardLight,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
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
    backgroundColor: Colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    opacity: 0.8,
  },
  emptyButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.extraLarge,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    ...Shadows.medium,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayGroup: {
    marginBottom: Spacing.lg,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  memoryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 55, 60, 0.75)',
    borderRadius: BorderRadius.extraLarge,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 80, // Ensure minimum height for visibility
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  memoryIconBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.cardDark,
    borderWidth: 1,
    borderColor: Colors.border,
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
  memoryTitleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  memoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  memoryHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeBadge: {
    backgroundColor: Colors.cardDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.textSecondary,
    lineHeight: 24,
    opacity: 0.7,
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
    borderRadius: BorderRadius.large,
    marginTop: Spacing.sm,
    backgroundColor: Colors.cardDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardDark,
    borderRadius: BorderRadius.large,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.cardDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.large,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.cardDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  transcriptContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.cardDark,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transcriptText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
});


