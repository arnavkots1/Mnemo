/**
 * CaptureScreen - Home screen - FULLY RESPONSIVE
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSettingsContext } from '../store/SettingsContext';
import { CaptureStackParamList } from '../navigation/CaptureStackNavigator';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';
import { GlassSurface } from '../components/GlassSurface';

type CaptureScreenNavigationProp = NativeStackNavigationProp<CaptureStackParamList, 'Capture'>;

export const CaptureScreen: React.FC = () => {
  const navigation = useNavigation<CaptureScreenNavigationProp>();
  const { settings } = useSettingsContext();
  const dimensions = useWindowDimensions();
  
  // Responsive sizing
  const isSmallScreen = dimensions.width < 380;
  const isTinyScreen = dimensions.width < 350;
  const heroTitleSize = isTinyScreen ? 36 : isSmallScreen ? 42 : 48;
  const heroSubSize = isTinyScreen ? 14 : isSmallScreen ? 15 : 16;
  const visionTitleSize = isTinyScreen ? 22 : isSmallScreen ? 24 : 26;
  const visionSubtitleSize = isTinyScreen ? 12 : isSmallScreen ? 13 : 14;
  const cardTitleSize = isTinyScreen ? 16 : isSmallScreen ? 18 : 20;
  const cardDescSize = isTinyScreen ? 12 : isSmallScreen ? 13 : 14;
  const badgeTextSize = isTinyScreen ? 9 : 10;
  
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

  const handleOpenMoments = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Moments' as never);
    }
  };

  const handleOpenSettings = () => {
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Settings' as never);
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
        <Text style={[styles.greeting, { fontSize: heroSubSize }]}>Hello,</Text>
        <Text style={[styles.name, { fontSize: heroTitleSize }]}>Welcome Back</Text>
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
      <GlassSurface style={styles.visionCard} intensity={36}>
        <View style={styles.visionHeader}>
          <View>
            <View style={styles.featureBadge}>
              <Text style={[styles.featureBadgeText, { fontSize: badgeTextSize }]}>NEW</Text>
            </View>
            <Text style={[styles.visionTitle, { fontSize: visionTitleSize }]}>Mnemo Vision</Text>
            <Text style={[styles.visionSubtitle, { fontSize: visionSubtitleSize }]}>AI-Powered Memory Creation</Text>
          </View>
        </View>

        <Text style={[styles.visionDescription, { fontSize: cardDescSize }]}>
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
      </GlassSurface>

      {/* Action Cards Grid */}
      <View style={styles.grid}>
        {/* Voice Recording Card */}
        <GlassSurface style={styles.actionCard} intensity={28}>
          <View style={styles.cardIconBadge}>
            <Text style={styles.cardIcon}>🎙️</Text>
          </View>
          <Text style={[styles.cardTitle, { fontSize: cardTitleSize }]}>Voice{'\n'}Moments</Text>
          <Text style={[styles.cardDescription, { fontSize: cardDescSize }]}>
            Record your thoughts
          </Text>
          <TouchableOpacity 
            style={styles.cardButton}
            onPress={handleStartCapture}
          >
            <Text style={styles.cardButtonText}>Start</Text>
          </TouchableOpacity>
        </GlassSurface>

        {/* Photo Memories Card */}
        <GlassSurface style={styles.actionCard} intensity={28}>
          <View style={styles.cardIconBadge}>
            <Text style={styles.cardIcon}>📸</Text>
          </View>
          <Text style={[styles.cardTitle, { fontSize: cardTitleSize }]}>Photo{'\n'}Memories</Text>
          <Text style={[styles.cardDescription, { fontSize: cardDescSize }]}>
            Import & organize
          </Text>
          <TouchableOpacity 
            style={styles.cardTag}
            onPress={handleOpenMoments}
          >
            <Text style={styles.cardTagText}>In Moments →</Text>
          </TouchableOpacity>
        </GlassSurface>

        {/* Location Tracking Card */}
        <GlassSurface style={styles.actionCard} intensity={28}>
          <View style={styles.cardIconBadge}>
            <Text style={styles.cardIcon}>📍</Text>
          </View>
          <Text style={[styles.cardTitle, { fontSize: cardTitleSize }]}>Places{'\n'}Visited</Text>
          <Text style={[styles.cardDescription, { fontSize: cardDescSize }]}>
            Track your journey
          </Text>
          <TouchableOpacity 
            style={styles.cardTag}
            onPress={handleOpenSettings}
          >
            <Text style={styles.cardTagText}>In Settings</Text>
          </TouchableOpacity>
        </GlassSurface>

        {/* Today Summary Card - Wide */}
        <GlassSurface style={[styles.actionCard, styles.wideCard]} intensity={28}>
          <Text style={[styles.summaryTitle, { fontSize: cardTitleSize }]}>Today's Summary</Text>
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
        </GlassSurface>
      </View>

      {/* Privacy Info */}
      <GlassSurface style={styles.infoCard} intensity={24}>
        <Text style={styles.infoTitle}>Private by design</Text>
        <Text style={styles.infoText}>
          Everything stays on your device. No cloud sync unless you choose it.
        </Text>
      </GlassSurface>

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
    color: Colors.textMuted,
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
    borderRadius: BorderRadius.extraLarge,
    backgroundColor: 'rgba(52, 55, 60, 0.65)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.small,
  },
  pillActive: {
    backgroundColor: Colors.cardLight,
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
    borderRadius: BorderRadius.extraLarge,
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
    borderRadius: BorderRadius.large,
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
    fontWeight: '600',
    color: Colors.textMuted,
  },
  visionDescription: {
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
    borderRadius: BorderRadius.extraLarge,
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
    borderRadius: BorderRadius.extraLarge,
    padding: Spacing.md,
    ...Shadows.small,
  },
  wideCard: {
    width: '100%',
  },
  cardIconBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.cardDark,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: 24,
  },
  cardDescription: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  cardButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.extraLarge,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardTag: {
    backgroundColor: Colors.cardDark,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.extraLarge,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    opacity: 0.9,
  },
  summaryTitle: {
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
    backgroundColor: Colors.cardDark,
    borderRadius: BorderRadius.extraLarge,
    borderWidth: 1,
    borderColor: Colors.border,
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
    opacity: 0.9,
  },
});


