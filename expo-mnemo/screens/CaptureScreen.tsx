/**
 * CaptureScreen - Main screen for starting emotional capture sessions
 * 
 * This replaces the old TodayScreen's emotional capture button.
 * Provides a dedicated space for starting capture sessions.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsContext } from '../store/SettingsContext';
import { CaptureStackParamList } from '../navigation/CaptureStackNavigator';

type CaptureScreenNavigationProp = NativeStackNavigationProp<CaptureStackParamList, 'Capture'>;

export const CaptureScreen: React.FC = () => {
  const navigation = useNavigation<CaptureScreenNavigationProp>();
  const { settings } = useSettingsContext();
  
  const handleStartCapture = () => {
    // Check if audio capture is enabled
    if (!settings.allowAudioEmotionalCapture) {
      Alert.alert(
        'Audio Capture Disabled',
        'Please enable "Allow Audio-based Emotional Capture" in Settings to start a capture session.'
      );
      return;
    }
    
    navigation.navigate('EmotionalSession');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Capture</Text>
        <Text style={styles.subtitle}>Record emotional moments</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎤</Text>
        </View>
        
        <Text style={styles.description}>
          Start an emotional capture session to record and analyze your emotional moments.
        </Text>
        
        <Text style={styles.info}>
          The app will record audio and detect emotions like happiness, surprise, and more.
        </Text>
        
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartCapture}
        >
          <Text style={styles.startButtonText}>
            Start Capture Session
          </Text>
        </TouchableOpacity>
        
        {!settings.allowAudioEmotionalCapture && (
          <Text style={styles.warning}>
            Audio capture is disabled in Settings
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 60,
  },
  description: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 26,
  },
  info: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  warning: {
    marginTop: 20,
    fontSize: 14,
    color: '#ff4444',
    textAlign: 'center',
  },
});

