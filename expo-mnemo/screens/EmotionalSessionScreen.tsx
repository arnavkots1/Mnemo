/**
 * EmotionalSessionScreen - Full-screen emotional capture session
 * 
 * Records audio in windows, classifies emotions, and creates memory entries
 * for detected emotional moments.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMemoryContext } from '../store/MemoryContext';
import { useSettingsContext } from '../store/SettingsContext';
import { createMemoryEntry } from '../types/MemoryEntry';
import { classifyEmotion, Emotion } from '../services/EmotionClassifier';
import { CaptureStackParamList } from '../navigation/CaptureStackNavigator';
import { saveAudioFile } from '../services/audioStorageService';

type EmotionalSessionNavigationProp = NativeStackNavigationProp<CaptureStackParamList, 'EmotionalSession'>;

const ANALYSIS_INTERVAL_SEC = 10; // Analyze every 10 seconds
const TRIGGER_EMOTIONS: Emotion[] = ['happy', 'surprised']; // Emotions that trigger memory creation

export const EmotionalSessionScreen: React.FC = () => {
  const navigation = useNavigation<EmotionalSessionNavigationProp>();
  const { addMemory } = useMemoryContext();
  const { settings } = useSettingsContext();
  
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastEmotionDetected, setLastEmotionDetected] = useState<Emotion | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Check if audio capture is enabled
    if (!settings.allowAudioEmotionalCapture) {
      Alert.alert(
        'Audio Capture Disabled',
        'Please enable "Allow Audio-based Emotional Capture" in Settings to use this feature.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }
    
    // Request permissions and start
    requestPermissionsAndStart();
    
    // Cleanup on unmount
    return () => {
      stopRecording();
      cleanup();
    };
  }, [settings.allowAudioEmotionalCapture]);
  
  const requestPermissionsAndStart = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        setHasPermission(false);
        Alert.alert(
          'Microphone Permission Required',
          'Mnemo needs microphone access to capture emotional moments. Please enable it in Settings.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return;
      }
      
      setHasPermission(true);
      await startRecording();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
      Alert.alert('Error', 'Failed to request microphone permission.');
    }
  };
  
  const startRecording = async () => {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      sessionStartTimeRef.current = new Date();
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        if (sessionStartTimeRef.current) {
          const elapsed = Math.floor(
            (Date.now() - sessionStartTimeRef.current.getTime()) / 1000
          );
          setSessionDuration(elapsed);
        }
      }, 1000);
      
      // Start periodic analysis
      analysisIntervalRef.current = setInterval(() => {
        analyzeCurrentRecording();
      }, ANALYSIS_INTERVAL_SEC * 1000);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };
  
  const analyzeCurrentRecording = async () => {
    if (!recordingRef.current || isAnalyzing) {
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Get recording status to check duration
      const status = await recordingRef.current.getStatusAsync();
      
      if (!status.isRecording || !status.uri) {
        setIsAnalyzing(false);
        return;
      }
      
      const durationSec = status.durationMillis ? status.durationMillis / 1000 : 0;
      
      // For stub, we don't have actual audio level, so simulate it
      // In a real implementation, you'd analyze the audio buffer
      const averageLevel = Math.random() * 0.5 + 0.3; // Simulated: 0.3 to 0.8
      
      // Classify emotion (uses API if configured, otherwise local stub)
      const result = await classifyEmotion({
        durationSec,
        averageLevel,
        audioUri: status.uri,
      });
      
      const emotion = result.emotion;
      setLastEmotionDetected(emotion);
      
      // Check if emotion should trigger memory creation
      if (TRIGGER_EMOTIONS.includes(emotion)) {
        // Create memory entry first to get the ID
        const summary = `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} moment: [stub, no transcript yet]`;
        
        const memory = createMemoryEntry('emotional', summary, {
          startTime: new Date(),
          details: {
            emotion,
            confidence: result.confidence,
            audioUri: status.uri, // Temporary URI initially
            durationSec,
            averageLevel,
          },
        });
        
        // Save audio file to permanent storage using memory ID
        let permanentAudioUri = status.uri;
        try {
          permanentAudioUri = await saveAudioFile(status.uri, memory.id);
          
          // Update memory with permanent URI
          memory.details = {
            ...memory.details,
            audioUri: permanentAudioUri,
          };
        } catch (error) {
          console.error('Error saving audio file:', error);
          // Continue with temp URI if save fails
        }
        
        // Add to memory store
        await addMemory(memory);
        
        // Show toast notification
        Alert.alert(
          'Emotional Moment Captured!',
          `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} moment detected and saved.`,
          [{ text: 'OK' }]
        );
      }
      
      // Optionally restart recording for next window
      // For now, we'll continue the same recording
      
    } catch (error) {
      console.error('Error analyzing recording:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const stopRecording = async () => {
    if (!recordingRef.current) {
      return;
    }
    
    try {
      // Get final recording status before stopping
      const status = await recordingRef.current.getStatusAsync();
      
      await recordingRef.current.stopAndUnloadAsync();
      const recordingUri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      
      cleanup();
      
      console.log('Recording stopped');
      
      // Analyze and save final recording if there's any audio
      if (recordingUri && status.durationMillis && status.durationMillis > 0) {
        const durationSec = status.durationMillis / 1000;
        const averageLevel = Math.random() * 0.5 + 0.3; // Simulated
        
        try {
          const result = await classifyEmotion({
            durationSec,
            averageLevel,
            audioUri: recordingUri,
          });
          
          const emotion = result.emotion;
          
          // Save the recording regardless of emotion when session ends
          const summary = `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} moment captured`;
          
          const memory = createMemoryEntry('emotional', summary, {
            startTime: sessionStartTimeRef.current || new Date(),
            endTime: new Date(),
            details: {
              emotion,
              confidence: result.confidence,
              audioUri: recordingUri, // Temporary URI initially
              durationSec,
              averageLevel,
            },
          });
          
          // Save audio file to permanent storage
          let permanentAudioUri = recordingUri;
          try {
            permanentAudioUri = await saveAudioFile(recordingUri, memory.id);
            memory.details = {
              ...memory.details,
              audioUri: permanentAudioUri,
            };
          } catch (error) {
            console.error('Error saving audio file:', error);
          }
          
          // Add to memory store
          await addMemory(memory);
          
          console.log(`Final recording saved: ${emotion} moment`);
          console.log(`Memory ID: ${memory.id}, Audio URI: ${permanentAudioUri}`);
        } catch (error) {
          console.error('Error analyzing final recording:', error);
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };
  
  const cleanup = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  };
  
  const handleEndSession = async () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this emotional capture session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            await stopRecording();
            // Navigate back to Capture screen
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Capture');
            }
          },
        },
      ]
    );
  };
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Microphone permission denied</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Mic Icon */}
        <View style={styles.micContainer}>
          <Ionicons
            name="mic"
            size={120}
            color={isRecording ? '#007AFF' : '#999'}
          />
          {isAnalyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
        </View>
        
        {/* Instructions */}
        <Text style={styles.instructionText}>
          Listening for emotional moments.{'\n'}Keep this screen open.
        </Text>
        
        {/* Session Duration */}
        <View style={styles.durationContainer}>
          <Text style={styles.durationLabel}>Session Duration</Text>
          <Text style={styles.durationValue}>{formatDuration(sessionDuration)}</Text>
        </View>
        
        {/* Last Emotion Detected */}
        {lastEmotionDetected && (
          <View style={styles.emotionBadge}>
            <Text style={styles.emotionText}>
              Last detected: {lastEmotionDetected.charAt(0).toUpperCase() + lastEmotionDetected.slice(1)}
            </Text>
          </View>
        )}
        
        {/* Status */}
        <Text style={styles.statusText}>
          {isRecording
            ? isAnalyzing
              ? 'Analyzing audio...'
              : 'Recording...'
            : 'Not recording'}
        </Text>
      </View>
      
      {/* End Session Button */}
      <TouchableOpacity
        style={styles.endButton}
        onPress={handleEndSession}
      >
        <Text style={styles.endButtonText}>End Session</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    textAlign: 'center',
  },
  micContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  analyzingOverlay: {
    position: 'absolute',
    bottom: 0,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  durationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  durationValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emotionBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  emotionText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  endButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  endButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
