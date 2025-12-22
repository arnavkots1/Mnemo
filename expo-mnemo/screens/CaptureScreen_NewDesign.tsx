/**
 * CaptureScreen - Home screen with new soft pastel design
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
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';

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
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello,</Text>
        <Text style={styles.name}>Welcome Back</Text>
      </View>

      {/* Quick Actions - Pill Tabs */}
      <View style={styles.pillContainer}>
        <View style={[styles.pill, styles.pillActive]}>
          <Text style={styles.pillTextActive}>Today</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Memories</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Places</Text>
        </View>
      </View>

      {/* Vision Feature Card - Dark */}
      <View style={styles.visionCard}>
        <View style={styles.visionHeader}>
          <View>
            <View style={styles.featureBadge}>
              <Text style={styles.featureBadgeText}>NEW</Text>
            </View>
            <Text style={styles.visionTitle}>Mnemo Vision</Text>
            <Text style={styles.visionSubtitle}>AI-Powered Memory Creation</Text>
          </View>
        </View>

        <Text style={styles.visionDescription}>
          Combine photos, voice notes, and location. Our AI creates rich, meaningful 
          memories with intelligent insights.
        </Text>

        <View style={styles.visionFeatures}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Smart photo analysis</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Voice & emotion detection</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Location context</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.visionButton}
          onPress={handleOpenVision}
        >
          <Text style={styles.visionButtonText}>Try Mnemo Vision</Text>
        </TouchableOpacity>
      </View>

      {/* Action Cards Grid */}
      <View style={styles.grid}>
        {/* Voice Recording Card */}
        <View style={styles.actionCard}>
          <View style={styles.cardIconBadge}>
            <Text style={styles.cardIcon}>🎙️</Text>
          </View>
          <Text style={styles.cardTitle}>Voice{'\n'}Moments</Text>
          <Text style={styles.cardDescription}>
            Record your thoughts
          </Text>
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={handleStartCapture}
          >
            <Text style={styles.cardButtonText}>Start</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Memories Card */}
        <View style={styles.actionCard}>
          <View style={styles.cardIconBadge}>
            <Text style={styles.cardIcon}>📸</Text>
          </View>
          <Text style={styles.cardTitle}>Photo{'\n'}Memories</Text>
          <Text style={styles.cardDescription}>
            Import & organize
          </Text>
          <View style={styles.cardTag}>
            <Text style={styles.cardTagText}>In Moments →</Text>
          </View>
        </View>

        {/* Location Tracking Card */}
        <View style={styles.actionCard}>
          <View style={styles.cardIconBadge}>
            <Text style={styles.cardIcon}>📍</Text>
          </View>
          <Text style={styles.cardTitle}>Places{'\n'}Visited</Text>
          <Text style={styles.cardDescription}>
            Track your journey
          </Text>
          <View style={styles.cardTag}>
            <Text style={styles.cardTagText}>In Settings</Text>
          </View>
        </View>

        {/* Today Summary Card - Wide */}
        <View style={[styles.actionCard, styles.wideCard]}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Voice Notes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Places</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Privacy Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Private by design</Text>
        <Text style={styles.infoText}>
          Everything stays on your device. No cloud sync unless you choose it.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  pillContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.cardLight,
    ...Shadows.small,
  },
  pillActive: {
    backgroundColor: Colors.secondary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  visionCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.cardDark,
    borderRadius: BorderRadius.large,
    ...Shadows.medium,
  },
  visionHeader: {
    marginBottom: Spacing.md,
  },
  featureBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.sm,
  },
  featureBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  visionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textLight,
    marginBottom: 4,
  },
  visionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  visionDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
    marginBottom: Spacing.md,
    opacity: 0.9,
  },
  visionFeatures: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  featureText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
  },
  visionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    ...Shadows.small,
  },
  visionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  grid: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.cardLight,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },
  wideCard: {
    width: '100%',
  },
  cardIconBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  cardButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardTag: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
  },
  cardTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  infoCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.medium,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});


