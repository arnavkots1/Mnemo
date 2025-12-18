/**
 * VisionScreen - AI-powered memory generation
 * 
 * Combine photos, audio, and location to create rich memories
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
    if (!selectedPhoto && !audioUri && !location) {
      Alert.alert('Add some data', 'Select a photo, record audio, or add location to generate a memory');
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
        <View>
          <Text style={styles.title}>Mnemo Vision</Text>
          <Text style={styles.subtitle}>AI-powered memory creation</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroText}>
            Combine photos, voice, and location. Our AI creates beautiful memories.
          </Text>
        </View>

        {/* Input Cards */}
        <View style={styles.cardsContainer}>
          {/* Photo Card */}
          <View style={styles.inputCard}>
            <Text style={styles.cardTitle}>Photo</Text>
            <Text style={styles.cardDescription}>
              Add a photo for visual context
            </Text>
            
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
            <Text style={styles.cardTitle}>Voice Note</Text>
            <Text style={styles.cardDescription}>
              Record your thoughts
            </Text>
            
            {audioUri ? (
              <View style={styles.audioPreview}>
                <Text style={styles.audioPreviewText}>Recording saved</Text>
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
                <Text style={styles.addButtonText}>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Location Card */}
          <View style={styles.inputCard}>
            <Text style={styles.cardTitle}>Location</Text>
            <Text style={styles.cardDescription}>
              Where are you?
            </Text>
            
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
            <Text style={styles.cardTitle}>Your Note</Text>
            <Text style={styles.cardDescription}>
              Add your own caption
            </Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="What's happening?"
              placeholderTextColor="#64748b"
              value={userNote}
              onChangeText={setUserNote}
              multiline
              maxLength={200}
            />
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
              <ActivityIndicator color="#ffffff" />
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
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  hero: {
    padding: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  heroText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
    textAlign: 'center',
  },
  cardsContainer: {
    padding: 16,
    gap: 16,
  },
  inputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  recordingButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  addButtonText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '700',
  },
  previewContainer: {
    gap: 12,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  audioPreview: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 12,
  },
  audioPreviewText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  locationPreview: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 12,
  },
  locationText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearButtonText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '700',
  },
  generateButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoSection: {
    padding: 24,
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
  },
});

