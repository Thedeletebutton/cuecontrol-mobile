import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider } from '../src/context/AuthContext';
import { AppModeProvider } from '../src/context/AppModeContext';
import { LicenseProvider } from '../src/context/LicenseContext';
import { initializeFirebase } from '../src/services/firebase';
import { FIREBASE_CONFIG, IS_CONFIGURED } from '../src/config/firebase.config';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Auto-initialize Firebase with embedded config
    if (IS_CONFIGURED) {
      initializeFirebase(FIREBASE_CONFIG);
    }
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.main, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <LicenseProvider>
        <AppModeProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000000' },
            }}
          />
        </AppModeProvider>
      </LicenseProvider>
    </AuthProvider>
  );
}
