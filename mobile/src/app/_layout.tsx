import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../lib/AppContext';
import { NotificationProvider } from '../lib/notifications';
import { theme } from '../lib/theme';

// expo-notifications crashes at import inside Expo Go on Android (SDK 53+),
// so the tap router is loaded lazily and skipped when the module is missing.
let NotificationTapRouter: React.ComponentType | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationTapRouter = require('../lib/NotificationTapRouter').default;
  } catch {
    NotificationTapRouter = null;
  }
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isReady, user } = useApp();
  const segments = useSegments();

  useEffect(() => {
    if (!isReady) return;
    const inTabs = segments[0] === '(tabs)';
    if (!user && inTabs) router.replace('/login');
    if (user && !inTabs) router.replace('/(tabs)/monitors');
  }, [isReady, user, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <NotificationProvider>
        <AuthGate>
          {NotificationTapRouter && <NotificationTapRouter />}
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.bg },
            }}
          />
        </AuthGate>
      </NotificationProvider>
    </AppProvider>
  );
}
