/**
 * CaptureScreen - Home screen introducing the app
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
    if (!settings.allowAudioEmotionalCapture) {
      Alert.alert(
        'Audio Recording Off',
        'Turn on audio recording in Settings to capture voice moments.'
      );
      return;
    }
    navigation.navigate('EmotionalSession');
  };

  const handleOpenVision = () => {
    // Navigate to Vision tab (parent tab navigator)
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Vision' as never);
    }
  };
  
  return (
    <ScrollView 
      style={styles.container} 
      bounces={false}
      decelerationRate="fast"
      scrollEventThrottle={16}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Your Life,</Text>
          <Text style={styles.heroTitle}>Your Moments</Text>
          <Text style={styles.heroSubtitle}>
            Capture what matters. Photos, voice notes, and places—all in one beautiful timeline.
          </Text>
        </View>
      </View>

      {/* Vision Feature Highlight */}
      <View style={styles.visionSection}>
        <View style={styles.visionBadge}>
          <Text style={styles.visionBadgeText}>FEATURED</Text>
        </View>
        <Text style={styles.visionTitle}>Mnemo Vision</Text>
        <Text style={styles.visionSubtitle}>AI-Powered Memory Creation</Text>
        <Text style={styles.visionDescription}>
          Combine photos, voice notes, and location in one place. Our AI analyzes everything 
          and creates rich, meaningful memories with intelligent summaries and insights.
        </Text>
        
        <View style={styles.visionFeatures}>
          <View style={styles.visionFeature}>
            <Text style={styles.visionFeatureIcon}>✓</Text>
            <Text style={styles.visionFeatureText}>Smart photo analysis</Text>
          </View>
          <View style={styles.visionFeature}>
            <Text style={styles.visionFeatureIcon}>✓</Text>
            <Text style={styles.visionFeatureText}>Voice & emotion detection</Text>
          </View>
          <View style={styles.visionFeature}>
            <Text style={styles.visionFeatureIcon}>✓</Text>
            <Text style={styles.visionFeatureText}>Location context</Text>
          </View>
          <View style={styles.visionFeature}>
            <Text style={styles.visionFeatureIcon}>✓</Text>
            <Text style={styles.visionFeatureText}>Your personal notes</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.visionButton}
          onPress={handleOpenVision}
        >
          <Text style={styles.visionButtonText}>Open Mnemo Vision</Text>
          <Text style={styles.visionButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Feature Cards */}
      <View style={styles.features}>
        {/* Voice Card */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <Text style={styles.cardIcon}>🎙️</Text>
            </View>
            <Text style={styles.cardTitle}>Voice Moments</Text>
          </View>
          <Text style={styles.cardDescription}>
            Quick voice notes that capture your thoughts in the moment. Just tap and talk.
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleStartCapture}
          >
            <Text style={styles.primaryButtonText}>Record Now</Text>
          </TouchableOpacity>
        </View>

        {/* Photos Card */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <Text style={styles.cardIcon}>📸</Text>
            </View>
            <Text style={styles.cardTitle}>Photo Memories</Text>
          </View>
          <Text style={styles.cardDescription}>
            Import photos from your gallery. We'll organize them by time and place automatically.
          </Text>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>Check the Moments tab →</Text>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <Text style={styles.cardIcon}>📍</Text>
            </View>
            <Text style={styles.cardTitle}>Places</Text>
          </View>
          <Text style={styles.cardDescription}>
            Track where life takes you. We'll remember the places that matter to you.
          </Text>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>Enable in Settings</Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Everything stays private</Text>
        <Text style={styles.infoText}>
          All your moments live on your device. Nothing goes to the cloud unless you want it to.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  hero: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 24,
    backgroundColor: '#1e293b',
  },
  heroContent: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 52,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#94a3b8',
    lineHeight: 28,
    marginTop: 16,
    fontWeight: '400',
  },
  visionSection: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  visionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  visionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  visionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  visionSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  visionDescription: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
    marginBottom: 20,
  },
  visionFeatures: {
    gap: 12,
    marginBottom: 24,
  },
  visionFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  visionFeatureIcon: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '700',
  },
  visionFeatureText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  visionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    gap: 8,
  },
  visionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  visionButtonArrow: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
  },
  features: {
    padding: 20,
    gap: 16,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  infoChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoChipText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    padding: 24,
    marginTop: 20,
    marginBottom: 40,
    marginHorizontal: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  infoText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
  },
});

