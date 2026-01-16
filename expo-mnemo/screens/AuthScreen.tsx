import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signIn, signUp, resetPassword } from '../services/authService';

type AuthMode = 'login' | 'signup' | 'reset';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (mode === 'reset') {
      handlePasswordReset();
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (!displayName.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        console.log('✅ Signed in successfully');
      } else {
        await signUp(email.trim(), password, displayName.trim());
        Alert.alert(
          'Success! 🎉',
          'Account created! Please check your email to verify your account.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert(
        'Email Sent',
        'Password reset instructions have been sent to your email.',
        [{ text: 'OK', onPress: () => setMode('login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>📖 Mnemo</Text>
            <Text style={styles.tagline}>Your AI-powered memory companion</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </Text>

            {mode === 'signup' && (
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                editable={!loading}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            {mode !== 'reset' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />

                {mode === 'signup' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    editable={!loading}
                  />
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Email'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              {mode === 'login' && (
                <>
                  <TouchableOpacity onPress={() => setMode('reset')} disabled={loading}>
                    <Text style={styles.linkText}>Forgot Password?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMode('signup')} disabled={loading}>
                    <Text style={styles.linkText}>
                      Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {mode === 'signup' && (
                <TouchableOpacity onPress={() => setMode('login')} disabled={loading}>
                  <Text style={styles.linkText}>
                    Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              )}

              {mode === 'reset' && (
                <TouchableOpacity onPress={() => setMode('login')} disabled={loading}>
                  <Text style={styles.linkText}>Back to Sign In</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.features}>
            <Text style={styles.featureText}>✨ AI-powered memory analysis</Text>
            <Text style={styles.featureText}>📸 Photo & voice moments</Text>
            <Text style={styles.featureText}>📍 Automatic location tracking</Text>
            <Text style={styles.featureText}>☁️ Cloud backup & sync</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    backdropFilter: 'blur(10px)',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  linkTextBold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  features: {
    marginTop: 32,
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
});

