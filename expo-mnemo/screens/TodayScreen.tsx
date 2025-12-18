/**
 * TodayScreen - Timeline of all memories for today
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TodayStackParamList } from '../navigation/TodayStackNavigator';
import { useMemoryContext } from '../store/MemoryContext';
import { useSettingsContext } from '../store/SettingsContext';

type TodayScreenNavigationProp = NativeStackNavigationProp<TodayStackParamList, 'Today'>;

export const TodayScreen: React.FC = () => {
  const navigation = useNavigation<TodayScreenNavigationProp>();
  const { memories, getMemoriesForDay, refreshMemories, isLoading } = useMemoryContext();
  const { settings } = useSettingsContext();
  const [todayMemories, setTodayMemories] = useState(memories.filter(m => {
    const today = new Date();
    const memoryDate = new Date(m.startTime);
    return memoryDate.toDateString() === today.toDateString();
  }));
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loadTodayMemories = useCallback(async () => {
    const today = new Date();
    const todayMems = await getMemoriesForDay(today);
    setTodayMemories(todayMems);
  }, [getMemoriesForDay]);
  
  useEffect(() => {
    loadTodayMemories();
    
    // Refresh every minute
    const interval = setInterval(loadTodayMemories, 60000);
    return () => clearInterval(interval);
  }, [loadTodayMemories]);
  
  // Update today's memories when context memories change
  useEffect(() => {
    const today = new Date();
    const filtered = memories.filter(m => {
      const memoryDate = new Date(m.startTime);
      return memoryDate.toDateString() === today.toDateString();
    });
    setTodayMemories(filtered);
  }, [memories]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMemories();
    await loadTodayMemories();
    setIsRefreshing(false);
  };
  
  const handleStartEmotionalCapture = () => {
    // Check if audio capture is enabled
    if (!settings.allowAudioEmotionalCapture) {
      Alert.alert(
        'Audio Capture Disabled',
        'Please enable "Allow Audio-based Emotional Capture" in Settings to start an emotional capture session.'
      );
      return;
    }
    
    navigation.navigate('EmotionalSession');
  };
  
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getKindTag = (kind: string): string => {
    switch (kind) {
      case 'context': return '📍 Context';
      case 'emotional': return '💭 Emotional';
      case 'photo': return '📷 Photo';
      default: return kind;
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartEmotionalCapture}
      >
        <Text style={styles.startButtonText}>
          🎤 Start Emotional Capture
        </Text>
      </TouchableOpacity>
      
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
        ) : todayMemories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No memories yet today</Text>
            <Text style={styles.emptySubtext}>
              Start an emotional capture session or enable passive context logging
            </Text>
          </View>
        ) : (
          todayMemories.map((memory) => (
            <View key={memory.id} style={styles.memoryItem}>
              <View style={styles.memoryHeader}>
                <Text style={styles.memoryTime}>{formatTime(memory.startTime)}</Text>
                <View style={styles.memoryTags}>
                  <Text style={styles.memoryTag}>{getKindTag(memory.kind)}</Text>
                  {memory.activityType && memory.activityType !== 'unknown' && (
                    <Text style={styles.memoryTag}>{memory.activityType}</Text>
                  )}
                </View>
              </View>
              {memory.placeName && (
                <Text style={styles.memoryPlace}>{memory.placeName}</Text>
              )}
              <Text style={styles.memorySummary}>{memory.summary}</Text>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '500',
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ef4444',
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sessionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  stopButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  stopButtonText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 15,
  },
  startButton: {
    backgroundColor: '#3b82f6',
    padding: 18,
    margin: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  memoryItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  memoryTags: {
    flexDirection: 'row',
    gap: 8,
  },
  memoryTag: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    fontWeight: '500',
  },
  memoryPlace: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  memorySummary: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
    fontWeight: '500',
  },
});

