/**
 * LegalScreen - Displays Privacy Policy and Terms of Service
 * Required for app store compliance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/NewDesignColors';

type LegalDocument = 'privacy' | 'terms';

export const LegalScreen: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<LegalDocument>('privacy');
  const dimensions = useWindowDimensions();
  
  const isSmallScreen = dimensions.width < 380;
  const isTinyScreen = dimensions.width < 350;
  
  const titleSize = isTinyScreen ? 20 : isSmallScreen ? 24 : 28;
  const headingSize = isTinyScreen ? 16 : isSmallScreen ? 18 : 20;
  const bodySize = isTinyScreen ? 13 : isSmallScreen ? 14 : 15;
  const buttonTextSize = isTinyScreen ? 13 : isSmallScreen ? 14 : 15;

  const PrivacyPolicy = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.heading, { fontSize: headingSize }]}>Privacy Policy</Text>
      <Text style={[styles.lastUpdated, { fontSize: bodySize - 1 }]}>Last Updated: December 29, 2025</Text>
      
      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Introduction</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        Mnemo ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our mobile application (the "App").
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Information We Collect</Text>
      
      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Data You Provide</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        • Photos: Images you capture or import into the App{'\n'}
        • Audio Recordings: Voice recordings you create within the App{'\n'}
        • Text Notes: Written notes and descriptions you add to memories{'\n'}
        • Location Data: Location information when you grant location permissions
      </Text>

      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Data Collected Automatically</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        • Device Information: Device type, operating system version{'\n'}
        • Usage Data: How you interact with the App{'\n'}
        • Location Data: If you enable passive location tracking, we collect location data in the background
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>How We Use Your Information</Text>
      
      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Primary Uses</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        • Memory Creation: To create and store your personal memories{'\n'}
        • AI Processing: To generate summaries and analyze your memories using AI services (Google Gemini API){'\n'}
        • App Functionality: To provide core features like photo storage, audio playback, and location tagging
      </Text>

      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>AI Processing</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        Your photos, audio, and notes may be sent to Google's Gemini AI service for analysis and summary generation. This processing helps create meaningful daily summaries and memory descriptions. Data sent to Gemini is processed according to Google's privacy policies.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Data Storage</Text>
      
      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Local Storage</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        All your memories are stored locally on your device using AsyncStorage. We do not automatically sync or backup your data to cloud services. You can delete all data at any time through the App settings.
      </Text>

      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Third-Party Services</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        When generating AI summaries, data is temporarily sent to Google's servers. We do not store your data on third-party servers permanently. Data is sent for processing and returned to your device.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Data Security</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        • Local Encryption: Data stored on your device uses device-level encryption{'\n'}
        • Secure Transmission: Data sent to AI services uses HTTPS encryption{'\n'}
        • No Account Required: We do not require account creation, reducing data exposure risk
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Your Rights</Text>
      
      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Access and Control</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        • View Your Data: All your memories are accessible within the App{'\n'}
        • Delete Data: You can delete individual memories or all data at any time{'\n'}
        • Export Data: You can export your data through device backup features
      </Text>

      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Permissions</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        • Camera: Required to capture photos for memories{'\n'}
        • Microphone: Required to record audio for memories{'\n'}
        • Location: Optional - used to tag memories with location data{'\n'}
        • Photo Library: Required to import existing photos
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Children's Privacy</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        Mnemo is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Data Retention</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        Data remains on your device until you delete it. Data sent to AI services is processed and not retained. When you delete data, it is permanently removed from your device.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Changes to This Policy</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date. Continued use of the App after changes constitutes acceptance of the updated policy.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Compliance</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        This Privacy Policy complies with GDPR (EU users), CCPA (California users), COPPA (children's data), and App Store requirements (Google Play and Apple App Store policies).
      </Text>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );

  const TermsOfService = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.heading, { fontSize: headingSize }]}>Terms of Service</Text>
      <Text style={[styles.lastUpdated, { fontSize: bodySize - 1 }]}>Last Updated: December 29, 2025</Text>
      
      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Agreement to Terms</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        By downloading, installing, or using Mnemo (the "App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Description of Service</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        Mnemo is a personal memory and journaling application that allows users to capture and store photos, audio recordings, and notes; generate AI-powered daily summaries; organize and review personal memories; and tag memories with location data.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>User Responsibilities</Text>
      
      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Acceptable Use</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        You agree to use the App only for lawful purposes. You agree not to use the App for any illegal purpose, violate any laws, infringe on the rights of others, upload harmful content, attempt to reverse engineer the App, or use automated systems to access the App.
      </Text>

      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Content Ownership</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        You retain all ownership rights to content you create in the App. You are solely responsible for the content you create. We do not claim ownership of your memories or data.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>AI-Generated Content</Text>
      
      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Disclaimer</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        AI-generated summaries are created using third-party AI services (Google Gemini). Summaries are generated automatically and may contain inaccuracies. We do not guarantee the accuracy, completeness, or usefulness of AI-generated content. You should review and verify AI-generated summaries before relying on them.
      </Text>

      <Text style={[styles.subsectionTitle, { fontSize: bodySize + 1 }]}>Limitations</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        AI processing depends on available data and may produce limited results with minimal input. AI summaries are suggestions, not definitive records. We are not responsible for errors in AI-generated content.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Service Availability</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        We do not guarantee uninterrupted or error-free service. The App may be unavailable due to maintenance, updates, or technical issues. We reserve the right to modify or discontinue the App at any time.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Data and Privacy</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        Your data is stored locally on your device. We do not provide cloud backup services. You are responsible for backing up your data. We are not responsible for data loss due to device failure or deletion. Your use of the App is subject to our Privacy Policy.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Limitation of Liability</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Termination</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        You may stop using the App at any time by deleting it from your device. We may terminate or suspend your access to the App at any time, with or without cause or notice, for any reason, including if you breach these Terms.
      </Text>

      <Text style={[styles.sectionTitle, { fontSize: headingSize - 2 }]}>Changes to Terms</Text>
      <Text style={[styles.bodyText, { fontSize: bodySize }]}>
        We reserve the right to modify these Terms at any time. We will notify you of material changes by updating the "Last Updated" date. Continued use of the App after changes constitutes acceptance of the updated Terms.
      </Text>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: titleSize }]}>Legal</Text>
      </View>

      {/* Document Selector */}
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            activeDoc === 'privacy' && styles.selectorButtonActive,
          ]}
          onPress={() => setActiveDoc('privacy')}
        >
          <Text
            style={[
              styles.selectorText,
              { fontSize: buttonTextSize },
              activeDoc === 'privacy' && styles.selectorTextActive,
            ]}
          >
            Privacy Policy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            activeDoc === 'terms' && styles.selectorButtonActive,
          ]}
          onPress={() => setActiveDoc('terms')}
        >
          <Text
            style={[
              styles.selectorText,
              { fontSize: buttonTextSize },
              activeDoc === 'terms' && styles.selectorTextActive,
            ]}
          >
            Terms of Service
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeDoc === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.extraLarge + 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.cardLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  selectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.cardLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  selectorButtonActive: {
    backgroundColor: Colors.primary,
  },
  selectorText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  selectorTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  heading: {
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  lastUpdated: {
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  subsectionTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  bodyText: {
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
});

