import { Fab, FabIcon } from '@/components/ui/fab';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { MoonIcon, SunIcon } from '@/components/ui/icon';
import '@/global.css';
import { SessionProvider, useSession } from '@/lib/session';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export { ErrorBoundary } from 'expo-router';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark');
  const { top } = useSafeAreaInsets();
  const isDark = colorMode === 'dark';

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GluestackUIProvider mode={colorMode}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <SessionProvider>
            <RootNavigator />
          </SessionProvider>
          <Fab
            accessibilityLabel={isDark ? 'Byt till ljust tema' : 'Byt till mörkt tema'}
            onPress={() => setColorMode(isDark ? 'light' : 'dark')}
            placement="top right"
            style={{ top: top + 8 }}
          >
            <FabIcon as={isDark ? SunIcon : MoonIcon} />
          </Fab>
        </GluestackUIProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { signedIn, restoring, restoreError } = useSession();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!restoring && !restoreError && !signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="expenses" />
      </Stack.Protected>
      <Stack.Protected guard={false}>
        <Stack.Screen name="modal" />
      </Stack.Protected>
    </Stack>
  );
}
