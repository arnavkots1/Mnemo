/**
 * Voice Recording Screen - Responsive Siri-style reactive audio visualization
 * 
 * Features:
 * - REAL audio-reactive waves (responds to your voice)
 * - Fully responsive to any phone screen size
 * - Returns to home after session ends
 * - Auto-generates memories in Moments tab
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemoryContext } from '../store/MemoryContext';
import { useSettingsContext } from '../store/SettingsContext';
import { createMemoryEntry } from '../types/MemoryEntry';
import { classifyEmotion, Emotion } from '../services/EmotionClassifier';
import { CaptureStackParamList } from '../navigation/CaptureStackNavigator';
import { saveAudioFile } from '../services/audioStorageService';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';

type EmotionalSessionNavigationProp = NativeStackNavigationProp<CaptureStackParamList, 'EmotionalSession'>;

const ANALYSIS_INTERVAL_SEC = 10;
const TRIGGER_EMOTIONS: Emotion[] = ['happy', 'surprised'];
const NUM_BARS = 40; // Siri-style wave bars

export const EmotionalSessionScreen: React.FC = () => {
  const navigation = useNavigation<EmotionalSessionNavigationProp>();
  const { addMemory } = useMemoryContext();
  const { settings } = useSettingsContext();
  const dimensions = useWindowDimensions();
  
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastEmotionDetected, setLastEmotionDetected] = useState<Emotion | null>(null);
  const [audioMetering, setAudioMetering] = useState<number[]>(Array(NUM_BARS).fill(0));
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const meteringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animated bars for Siri-style visualization
  const barAnimations = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(0.1))
  ).current;
  
  useEffect(() => {
    if (!settings.allowAudioEmotionalCapture) {
      Alert.alert(
        'Audio Capture Disabled',
        'Please enable "Allow Audio-based Emotional Capture" in Settings to use this feature.',
        [{ text: 'OK', onPress: () => navigation.navigate('Capture') }]
      );
      return;
    }
    
    requestPermissionsAndStart();
    
    return () => {
      stopRecording();
      cleanup();
    };
  }, [settings.allowAudioEmotionalCapture]);
  
  // Animate bars based on REAL audio levels
  useEffect(() => {
    if (!isRecording) return;
    
    const animations = barAnimations.map((bar, index) => {
      const targetHeight = audioMetering[index] || 0.1;
      
      return Animated.spring(bar, {
        toValue: targetHeight,
        friction: 8,
        tension: 100,
        useNativeDriver: false, // height animation
      });
    });
    
    Animated.parallel(animations).start();
  }, [audioMetering, isRecording]);
  
  const requestPermissionsAndStart = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        setHasPermission(false);
        Alert.alert(
          'Microphone Permission Required',
          'Mnemo needs microphone access to capture voice moments.',
          [{ text: 'OK', onPress: () => navigation.navigate('Capture') }]
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100 // Update metering every 100ms
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      sessionStartTimeRef.current = new Date();
      
      console.log('Recording started');
      
      // Duration timer
      durationIntervalRef.current = setInterval(() => {
        if (sessionStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current.getTime()) / 1000);
          setSessionDuration(elapsed);
        }
      }, 1000);
      
      // REAL audio metering for reactive visualization
      meteringIntervalRef.current = setInterval(async () => {
        if (recordingRef.current) {
          try {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording && status.metering !== undefined) {
              // Convert metering to usable values for bars
              // metering ranges from -160 (silence) to 0 (max)
              const normalized = Math.max(0, (status.metering + 160) / 160);
              
              // Create wave pattern with center emphasis (like Siri)
              const newMetering = Array.from({ length: NUM_BARS }, (_, i) => {
                const centerDistance = Math.abs(i - NUM_BARS / 2) / (NUM_BARS / 2);
                const centerBoost = 1 - centerDistance * 0.5; // Center bars taller
                const randomVariation = Math.random() * 0.3 + 0.7;
                const height = normalized * centerBoost * randomVariation;
                
                return Math.max(0.05, Math.min(1, height)); // Clamp between 0.05 and 1
              });
              
              setAudioMetering(newMetering);
            }
          } catch (error) {
            // Silently handle metering errors
          }
        }
      }, 100);
      
      // Periodic emotion analysis
      analysisIntervalRef.current = setInterval(() => {
        analyzeCurrentRecording();
      }, ANALYSIS_INTERVAL_SEC * 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };
  
  const analyzeCurrentRecording = async () => {
    if (!recordingRef.current || isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      const status = await recordingRef.current.getStatusAsync();
      
      if (!status.isRecording || !status.uri) {
        setIsAnalyzing(false);
        return;
      }
      
      const durationSec = status.durationMillis ? status.durationMillis / 1000 : 0;
      const averageLevel = status.metering !== undefined ? (status.metering + 160) / 160 : 0.5;
      
      const result = await Promise.race([
        classifyEmotion({
          durationSec,
          averageLevel,
          audioUri: status.uri,
        }),
        new Promise<{ emotion: Emotion; confidence: number }>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 15000)
        ),
      ]).catch(() => ({ emotion: 'neutral' as Emotion, confidence: 0.5 }));
      
      const emotion = result.emotion;
      setLastEmotionDetected(emotion);
      
      if (TRIGGER_EMOTIONS.includes(emotion)) {
        const summary = `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} moment captured`;
        
        const memory = createMemoryEntry('emotional', summary, {
          startTime: new Date(),
          details: {
            emotion,
            confidence: result.confidence,
            audioUri: status.uri,
            durationSec,
            averageLevel,
          },
        });
        
        try {
          const permanentAudioUri = await saveAudioFile(status.uri, memory.id);
          memory.details = { ...memory.details, audioUri: permanentAudioUri };
        } catch (error) {
          console.error('Error saving audio file:', error);
        }
        
        await addMemory(memory);
        
        Alert.alert(
          'Moment Captured! ✨',
          `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} moment detected and saved to Moments.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error analyzing recording:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const stopRecording = async () => {
    if (!recordingRef.current) return;
    
    try {
      const status = await recordingRef.current.getStatusAsync();
      await recordingRef.current.stopAndUnloadAsync();
      const recordingUri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      
      cleanup();
      
      console.log('Recording stopped');
      
      // Save final recording to Moments
      if (recordingUri && status.durationMillis && status.durationMillis > 0) {
        const durationSec = status.durationMillis / 1000;
        const averageLevel = status.metering !== undefined ? (status.metering + 160) / 160 : 0.5;
        
        try {
          const result = await Promise.race([
            classifyEmotion({ durationSec, averageLevel, audioUri: recordingUri }),
            new Promise<{ emotion: Emotion; confidence: number }>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 15000)
            ),
          ]).catch(() => ({ emotion: 'neutral' as Emotion, confidence: 0.5 }));
          
          const emotion = result.emotion;
          const summary = `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} moment captured`;
          
          const memory = createMemoryEntry('emotional', summary, {
            startTime: sessionStartTimeRef.current || new Date(),
            endTime: new Date(),
            details: { 
              emotion, 
              confidence: result.confidence, 
              audioUri: recordingUri, 
              durationSec, 
              averageLevel 
            },
          });
          
          try {
            const permanentAudioUri = await saveAudioFile(recordingUri, memory.id);
            memory.details = { ...memory.details, audioUri: permanentAudioUri };
          } catch (error) {
            console.error('Error saving audio file:', error);
          }
          
          await addMemory(memory);
          console.log(`✅ Voice memory saved to Moments: ${emotion}`);
        } catch (error) {
          console.error('Error saving voice memory:', error);
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
    if (meteringIntervalRef.current) {
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }
  };
  
  const handleEndSession = async () => {
    Alert.alert('End Session', 'Save this voice moment to your Moments?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save & Exit',
        onPress: async () => {
          await stopRecording();
          // Go back to Home (not Moments)
          navigation.navigate('Capture');
        },
      },
    ]);
  };
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Responsive calculations
  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;
  const isSmallScreen = screenHeight < 700;
  const visualizerHeight = isSmallScreen ? screenHeight * 0.3 : screenHeight * 0.35;
  const barWidth = Math.max(3, (screenWidth * 0.8) / NUM_BARS);
  const maxBarHeight = visualizerHeight * 0.8;
  
  if (hasPermission === null) {
    return (
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </LinearGradient>
    );
  }
  
  if (hasPermission === false) {
    return (
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={styles.container}>
        <Text style={styles.errorText}>Microphone permission denied</Text>
      </LinearGradient>
    );
  }
  
  return (
    <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={styles.container}>
      <View style={styles.content}>
        {/* Siri-style Audio Visualizer */}
        <View style={[styles.visualizerContainer, { height: visualizerHeight }]}>
          <View style={styles.barsContainer}>
            {barAnimations.map((bar, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.bar,
                  {
                    width: barWidth,
                    height: bar.interpolate({
                      inputRange: [0, 1],
                      outputRange: [barWidth, maxBarHeight],
                    }),
                    backgroundColor: index < NUM_BARS / 3 ? '#22d3ee' : 
                                   index < (NUM_BARS * 2) / 3 ? '#4ade80' : '#22d3ee',
                    opacity: bar.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        </View>
        
        {/* Status Text */}
        <Text style={[styles.instructionText, { fontSize: isSmallScreen ? 18 : 22 }]}>
          {isAnalyzing ? 'Analyzing...' : 'Speak naturally'}
        </Text>
        
        {/* Duration */}
        <View style={styles.durationContainer}>
          <Text style={[styles.durationValue, { fontSize: isSmallScreen ? 48 : 64 }]}>
            {formatDuration(sessionDuration)}
          </Text>
          <Text style={styles.durationLabel}>Recording</Text>
        </View>
        
        {/* Last Emotion */}
        {lastEmotionDetected && (
          <View style={styles.emotionBadge}>
            <Text style={styles.emotionText}>
              Last: {lastEmotionDetected.charAt(0).toUpperCase() + lastEmotionDetected.slice(1)}
            </Text>
          </View>
        )}
      </View>
      
      {/* End Session Button - Fixed at bottom */}
      <TouchableOpacity 
        style={[styles.endButton, { paddingVertical: isSmallScreen ? Spacing.md : Spacing.lg }]} 
        onPress={handleEndSession}
      >
        <Text style={[styles.endButtonText, { fontSize: isSmallScreen ? 16 : 18 }]}>
          End Session
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 16,
    color: Colors.textLight,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  visualizerContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.extraLarge,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 2,
  },
  bar: {
    borderRadius: 4,
  },
  instructionText: {
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontWeight: '600',
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  durationValue: {
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: -2,
  },
  durationLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.tiny,
    fontWeight: '600',
  },
  emotionBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  emotionText: {
    fontSize: 13,
    color: '#4ade80',
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: Colors.peach,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    ...Shadows.button,
  },
  endButtonText: {
    color: Colors.charcoalDark,
    fontWeight: '700',
  },
});
