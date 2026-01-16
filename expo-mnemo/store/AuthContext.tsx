import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { subscribeToAuthState, AuthUser, signOut as authSignOut } from '../services/authService';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Setting up auth state listener...');
    
    const unsubscribe = subscribeToAuthState((authUser) => {
      console.log('🔐 Auth state changed:', authUser ? `Logged in as ${authUser.email}` : 'Logged out');
      setUser(authUser);
      setLoading(false);
    });

    return () => {
      console.log('🔐 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await authSignOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

