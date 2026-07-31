import { Stack, useRouter, useSegments, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useContext } from 'react';
import { useColorScheme, View, StyleSheet, Platform, LogBox } from 'react-native';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { AlertProvider } from '../context/AlertContext';
import { AudioProvider, AudioContext } from '../context/AudioContext';
import LoadingScreen from '../components/LoadingScreen';

// Suppress known warning from react-native-svg on Web
if (Platform.OS === 'web') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('transform-origin')) {
      return;
    }
    originalConsoleError(...args);
  };
}

// Ignore Expo LogBox error overlay for specific warnings
LogBox.ignoreLogs([
  "Invalid DOM property `transform-origin`",
  "Warning: React does not recognize the `transform-origin` prop"
]);

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading, isGlobalLoading } = useContext(AuthContext);
  const { playBgm, stopBgm } = useContext(AudioContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      stopBgm();
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      playBgm();
      router.replace('/(tabs)');
    } else if (user && !inAuthGroup) {
      playBgm();
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {isGlobalLoading && (
        <View style={StyleSheet.absoluteFill}>
          <LoadingScreen />
        </View>
      )}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <AudioProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AudioProvider>
    </AlertProvider>
  );
}
