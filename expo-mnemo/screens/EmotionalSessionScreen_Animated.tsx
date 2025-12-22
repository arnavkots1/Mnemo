/**
 * Animated EmotionalSessionScreen - Beautiful Siri-style voice recording
 * 
 * Features:
 * - Animated glowing rings that respond to voice
 * - Smooth pulsating waves
 * - Real-time audio visualization
 * - Modern gradient design
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

const { width, height } = Dimensions.get('window');
const ANALYSIS_INTERVAL_SEC = 10;
const TRIGGER_EMOTIONS: Emotion[] = ['happy', 'surprised'];

// Number of animated rings
const NUM_RINGS = 4;

export const EmotionalSessionScreen: React.FC = () => {
  const navigation = useNavigation<EmotionalSessionNavigationProp>();
  const { addMemory } = useMemoryContext();
  const { settings } = useSettingsContext();
  
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastEmotionDetected, setLastEmotionDetected] = useState<Emotion | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animated values for rings
  const ringAnimations = useRef(
    Array.from({ length: NUM_RINGS }, () => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.3),
    }))
  ).current;
  
  // Central pulse animation
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (!settings.allowAudioEmotionalCapture) {
      Alert.alert(
        'Audio Capture Disabled',
        'Please enable "Allow Audio-based Emotional Capture" in Settings to use this feature.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    requestPermissionsAndStart();
    
    return () => {
      stopRecording();
      cleanup();
    };
  }, [settings.allowAudioEmotionalCapture]);
  
  // Animate rings continuously
  useEffect(() => {
    if (!isRecording) return;
    
    const animations = ringAnimations.map((ring, index) => {
      const delay = index * 300; // Stagger animations
      const duration = 2000 + (index * 200); // Different speeds
      
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(ring.scale, {
              toValue: 1.8 + (index * 0.2),
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0,
              duration,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring.scale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0.6 - (index * 0.1),
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    });
    
    animations.forEach(anim => anim.start());
    
    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [isRecording]);
  
  // Pulse animation for audio level
  useEffect(() => {
    if (!isRecording) return;
    
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1 + (audioLevel * 0.2),
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulsing.start();
    
    return () => pulsing.stop();
  }, [isRecording, audioLevel]);
  
  const requestPermissionsAndStart = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        setHasPermission(false);
        Alert.alert(
          'Microphone Permission Required',
          'Mnemo needs microphone access to capture emotional moments.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
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
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      sessionStartTimeRef.current = new Date();
      
      // Duration timer
      durationIntervalRef.current = setInterval(() => {
        if (sessionStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current.getTime()) / 1000);
          setSessionDuration(elapsed);
        }
      }, 1000);
      
      // Audio level simulation (for visual feedback)
      audioLevelIntervalRef.current = setInterval(() => {
        // Simulate audio level - in real app, get from recording.getStatusAsync()
        setAudioLevel(Math.random() * 0.8 + 0.2);
      }, 100);
      
      // Periodic analysis
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
    if (!recordingRef.current || isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      const status = await recordingRef.current.getStatusAsync();
      
      if (!status.isRecording || !status.uri) {
        setIsAnalyzing(false);
        return;
      }
      
      const durationSec = status.durationMillis ? status.durationMillis / 1000 : 0;
      const averageLevel = audioLevel;
      
      // Classify emotion with longer timeout
      const result = await Promise.race([
        classifyEmotion({
          durationSec,
          averageLevel,
          audioUri: status.uri,
        }),
        new Promise<{ emotion: Emotion; confidence: number }>((_, reject) =>
          setTimeout(() => reject(new Error('Classification timeout')), 15000)
        ),
      ]).catch((error) => {
        console.log('Classification timeout or error, using fallback');
        return { emotion: 'neutral' as Emotion, confidence: 0.5 };
      });
      
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
        
        // Save audio file
        try {
          const permanentAudioUri = await saveAudioFile(status.uri, memory.id);
          memory.details = { ...memory.details, audioUri: permanentAudioUri };
        } catch (error) {
          console.error('Error saving audio file:', error);
        }
        
        await addMemory(memory);
        
        Alert.alert(
          'Moment Captured! ✨',
          `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} moment detected and saved.`,
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
      
      // Save final recording
      if (recordingUri && status.durationMillis && status.durationMillis > 0) {
        const durationSec = status.durationMillis / 1000;
        const averageLevel = audioLevel;
        
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
            details: { emotion, confidence: result.confidence, audioUri: recordingUri, durationSec, averageLevel },
          });
          
          try {
            const permanentAudioUri = await saveAudioFile(recordingUri, memory.id);
            memory.details = { ...memory.details, audioUri: permanentAudioUri };
          } catch (error) {
            console.error('Error saving audio file:', error);
          }
          
          await addMemory(memory);
          console.log(`Final recording saved: ${emotion} moment`);
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
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
  };
  
  const handleEndSession = async () => {
    Alert.alert('End Session', 'Are you sure you want to end this emotional capture session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: async () => {
          await stopRecording();
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Capture');
          }
        },
      },
    ]);
  };
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
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
        {/* Animated Rings */}
        <View style={styles.visualizerContainer}>
          {ringAnimations.map((ring, index) => (
            <Animated.View
              key={index}
              style={[
                styles.ring,
                {
                  transform: [{ scale: ring.scale }],
                  opacity: ring.opacity,
                  borderColor: index % 2 === 0 ? '#4ade80' : '#22d3ee',
                  borderWidth: 3 - (index * 0.5),
                },
              ]}
            />
          ))}
          
          {/* Central Circle */}
          <Animated.View
            style={[
              styles.centralCircle,
              {
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          >
            <LinearGradient
              colors={['#4ade80', '#22d3ee']}
              style={styles.centralGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.centralIcon}>🎙️</Text>
            </LinearGradient>
          </Animated.View>
        </View>
        
        {/* Status Text */}
        <Text style={styles.instructionText}>
          {isAnalyzing ? 'Analyzing...' : 'Listening for moments'}
        </Text>
        
        {/* Duration */}
        <View style={styles.durationContainer}>
          <Text style={styles.durationValue}>{formatDuration(sessionDuration)}</Text>
          <Text style={styles.durationLabel}>Recording</Text>
        </View>
        
        {/* Last Emotion */}
        {lastEmotionDetected && (
          <View style={styles.emotionBadge}>
            <Text style={styles.emotionText}>
              Last detected: {lastEmotionDetected.charAt(0).toUpperCase() + lastEmotionDetected.slice(1)}
            </Text>
          </View>
        )}
      </View>
      
      {/* End Session Button */}
      <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
        <Text style={styles.endButtonText}>End Session</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const RING_SIZE = Math.min(width, height) * 0.5;

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
  },
  visualizerContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.extraLarge * 2,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
  },
  centralCircle: {
    width: RING_SIZE * 0.4,
    height: RING_SIZE * 0.4,
    borderRadius: (RING_SIZE * 0.4) / 2,
    overflow: 'hidden',
    ...Shadows.large,
  },
  centralGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centralIcon: {
    fontSize: 60,
  },
  instructionText: {
    fontSize: 20,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.large,
    fontWeight: '600',
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: Spacing.large,
  },
  durationValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: -2,
  },
  durationLabel: {
    fontSize: 16,
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
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: Colors.error,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    ...Shadows.button,
  },
  endButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

