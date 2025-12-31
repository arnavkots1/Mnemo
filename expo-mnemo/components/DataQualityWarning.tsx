/**
 * DataQualityWarning - Shows warnings when memory has limited data
 * Displays in yellow to inform user about data quality
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../constants/NewDesignColors';
import { GlassSurface } from './GlassSurface';

export type DataQuality = 'excellent' | 'good' | 'limited' | 'minimal';

interface Props {
  quality: DataQuality;
  warnings: string[];
  dataSources: string[];
  style?: any;
}

export const DataQualityWarning: React.FC<Props> = ({ quality, warnings, dataSources, style }) => {
  // Don't show for excellent/good quality
  if (quality === 'excellent' || quality === 'good') {
    return null;
  }

  const getQualityTone = () => {
    switch (quality) {
      case 'limited':
        return Colors.primaryLight;
      case 'minimal':
        return Colors.warning;
      default:
        return Colors.secondary;
    }
  };

  const getQualityIcon = () => {
    switch (quality) {
      case 'limited':
        return '⚠️';
      case 'minimal':
        return '⚡';
      default:
        return 'ℹ️';
    }
  };

  const getQualityLabel = () => {
    switch (quality) {
      case 'limited':
        return 'Limited Data';
      case 'minimal':
        return 'Minimal Data';
      default:
        return 'Notice';
    }
  };

  const tone = getQualityTone();
  const textColor = Colors.textPrimary;

  return (
    <GlassSurface style={[styles.container, style]} intensity={22}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: tone }]}>{getQualityIcon()}</Text>
        <Text style={[styles.title, { color: textColor }]}>{getQualityLabel()}</Text>
      </View>
      
      {warnings.length > 0 && (
        <View style={styles.warningsContainer}>
          {warnings.map((warning, index) => (
            <Text key={index} style={[styles.warningText, { color: textColor }]}>
              • {warning}
            </Text>
          ))}
        </View>
      )}
      
      <View style={styles.sourcesContainer}>
        <Text style={styles.sourcesLabel}>Data used:</Text>
        <View style={styles.sourceTags}>
          {dataSources.map((source, index) => (
            <View key={index} style={[styles.sourceTag, { backgroundColor: 'rgba(52, 55, 60, 0.8)', borderColor: Colors.border }]}>
              <Text style={[styles.sourceTagText, { color: textColor }]}>
                {source.replace(/-/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  warningsContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.tiny,
  },
  sourcesContainer: {
    marginTop: Spacing.xs,
  },
  sourcesLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.tiny,
    fontWeight: '600',
  },
  sourceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.tiny,
  },
  sourceTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
  },
  sourceTagText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

