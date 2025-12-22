/**
 * VisionScreen - AI-powered memory generation
 * Soft pastel design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { createRichMemory, MemoryData } from '../services/memoryAnalyzer';
import { useMemoryContext } from '../store/MemoryContext';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';

export const VisionScreen: React.FC = () => {
  const { addMemory } = useMemoryContext();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; placeName?: string } | null>(null);
  const [userNote, setUserNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordingObject, setRecordingObject] = useState<Audio.Recording | null>(null);

  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedPhoto(result.assets[0].uri);
    }
  };

  const handleStartRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow microphone access');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecordingObject(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!recordingObject) return;

    try {
      await recordingObject.stopAndUnloadAsync();
      const uri = recordingObject.getURI();
      setAudioUri(uri);
      setIsRecording(false);
      setRecordingObject(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location access');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      
      try {
        const [result] = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        let placeName = 'Current location';
        if (result) {
          const parts = [];
          if (result.name) parts.push(result.name);
          if (result.street) parts.push(result.street);
          if (result.city) parts.push(result.city);
          placeName = parts.join(', ') || 'Current location';
        }

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          placeName,
        });
      } catch {
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          placeName: 'Current location',
        });
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const handleGenerate = async () => {
    if (!selectedPhoto && !audioUri && !location && !userNote.trim()) {
      Alert.alert('Add some data', 'Select a photo, record audio, add location, or write a note to generate a memory');
      return;
    }

    setIsGenerating(true);

    try {
      const memoryData: MemoryData = {
        photoUri: selectedPhoto || undefined,
        audioUri: audioUri || undefined,
        location: location || undefined,
        timestamp: new Date(),
        userNote: userNote.trim() || undefined,
      };

      const memory = await createRichMemory(
        selectedPhoto ? 'photo' : audioUri ? 'emotional' : 'context',
        memoryData
      );

      await addMemory({ ...memory, id: generateUUID() });

      Alert.alert('Success!', 'Memory created and saved to your timeline');

      // Reset form
      setSelectedPhoto(null);
      setAudioUri(null);
      setLocation(null);
      setUserNote('');
    } catch (error) {
      console.error('Error generating memory:', error);
      Alert.alert('Error', 'Failed to generate memory');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setSelectedPhoto(null);
    setAudioUri(null);
    setLocation(null);
    setUserNote('');
  };

  const hasData = selectedPhoto || audioUri || location || userNote.trim();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mnemo Vision</Text>
        <Text style={styles.subtitle}>AI-powered memory creation</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroText}>
            Combine photos, voice, and location. Our AI creates beautiful memories with intelligent insights.
          </Text>
        </View>

        {/* Input Cards */}
        <View style={styles.cardsContainer}>
          {/* Photo Card */}
          <View style={styles.inputCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>📸</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>Photo</Text>
                <Text style={styles.cardDescription}>Add a photo for visual context</Text>
              </View>
            </View>
            
            {selectedPhoto ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: selectedPhoto }} style={styles.photoPreview} />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={handleSelectPhoto}>
                <Text style={styles.addButtonText}>Select Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Audio Card */}
          <View style={styles.inputCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>🎙️</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>Voice Note</Text>
                <Text style={styles.cardDescription}>Record your thoughts</Text>
              </View>
            </View>
            
            {audioUri ? (
              <View style={styles.audioPreview}>
                <Text style={styles.audioPreviewText}>Recording saved ✓</Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setAudioUri(null)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.addButton, isRecording && styles.recordingButton]}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
              >
                <Text style={[styles.addButtonText, isRecording && styles.recordingButtonText]}>
                  {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Location Card */}
          <View style={styles.inputCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>📍</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>Location</Text>
                <Text style={styles.cardDescription}>Where are you?</Text>
              </View>
            </View>
            
            {location ? (
              <View style={styles.locationPreview}>
                <Text style={styles.locationText}>{location.placeName}</Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setLocation(null)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={handleGetLocation}>
                <Text style={styles.addButtonText}>Get Location</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Note Card */}
          <View style={styles.inputCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>✏️</Text>
              </View>
              <View>
                <Text style={styles.cardTitle}>Your Note</Text>
                <Text style={styles.cardDescription}>Add your own caption</Text>
              </View>
            </View>
            
            <TextInput
              style={styles.textInput}
              placeholder="What's happening?"
              placeholderTextColor={Colors.textMuted}
              value={userNote}
              onChangeText={setUserNote}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{userNote.length}/200</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {hasData && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.generateButton, !hasData && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={!hasData || isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.generateButtonText}>Generate Memory</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Our AI analyzes your inputs and generates a rich memory with intelligent summaries, 
            descriptions, and tags. The more data you provide, the better the result.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardDark,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textLight,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  hero: {
    padding: Spacing.lg,
    backgroundColor: Colors.cardDark,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  heroText: {
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 24,
    textAlign: 'center',
  },
  cardsContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  inputCard: {
    backgroundColor: Colors.cardLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    ...Shadows.small,
  },
  recordingButton: {
    backgroundColor: Colors.error,
  },
  addButtonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  recordingButtonText: {
    color: Colors.textLight,
  },
  previewContainer: {
    gap: Spacing.sm,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.background,
  },
  audioPreview: {
    backgroundColor: Colors.success,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  audioPreviewText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  locationPreview: {
    backgroundColor: Colors.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
  },
  locationText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  actionsContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  clearButton: {
    backgroundColor: Colors.cardLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  generateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    ...Shadows.medium,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoSection: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.medium,
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


