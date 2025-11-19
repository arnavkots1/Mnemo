/**
 * MemoryCard - Reusable component for displaying memory entries
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MemoryEntry, MemoryKind } from '../types/MemoryEntry';

interface MemoryCardProps {
  entry: MemoryEntry;
  onPress?: () => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ entry, onPress }) => {
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getEmotionEmoji = (emotion?: string): string => {
    const emojiMap: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      neutral: '😐',
    };
    return emojiMap[emotion || ''] || '📝';
  };
  
  const getKindIcon = (kind: MemoryKind): string => {
    switch (kind) {
      case 'context':
        return '📍';
      case 'emotional':
        return '💭';
      case 'photo':
        return '📷';
      default:
        return '📝';
    }
  };
  
  return (
    <View style={styles.card} onTouchEnd={onPress}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getKindIcon(entry.kind)}</Text>
        <View style={styles.headerText}>
          <Text style={styles.time}>{formatTime(entry.startTime)}</Text>
          {entry.placeName && (
            <Text style={styles.place}>{entry.placeName}</Text>
          )}
        </View>
      </View>
      
      {entry.kind === 'photo' && entry.details?.photoUri && (
        <Image
          source={{ uri: entry.details.photoUri }}
          style={styles.photo}
          resizeMode="cover"
        />
      )}
      
      <Text style={styles.summary}>{entry.summary}</Text>
      
      {entry.kind === 'emotional' && entry.details?.emotion && (
        <View style={styles.emotionBadge}>
          <Text style={styles.emotionEmoji}>
            {getEmotionEmoji(entry.details.emotion)}
          </Text>
          <Text style={styles.emotionText}>
            {entry.details.emotion.charAt(0).toUpperCase() + entry.details.emotion.slice(1)}
          </Text>
        </View>
      )}
      
      {entry.activityType && entry.activityType !== 'unknown' && (
        <Text style={styles.activity}>
          {entry.activityType.charAt(0).toUpperCase() + entry.activityType.slice(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  place: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  summary: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  emotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  emotionEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  emotionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activity: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

