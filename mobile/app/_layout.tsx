import { Button } from '@/components/ui/button';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { Icon, MoonIcon, SunIcon } from '@/components/ui/icon';
import '@/global.css';
import { SessionProvider, useSession } from '@/lib/session';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  const isDark = colorMode === 'dark';

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GluestackUIProvider mode={colorMode}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <SessionProvider>
            <RootNavigator isDark={isDark} toggleTheme={() => setColorMode(isDark ? 'light' : 'dark')} />
          </SessionProvider>
        </GluestackUIProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

function RootNavigator({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const { signedIn, restoring, restoreError } = useSession();

  return (
    <Stack screenOptions={{
      headerTitleAlign: 'center',
      headerBackButtonDisplayMode: 'minimal',
      headerRight: () => (
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={isDark ? 'Byt till ljust tema' : 'Byt till mörkt tema'}
          onPress={toggleTheme}
        >
          <Icon as={isDark ? SunIcon : MoonIcon} size="lg" />
        </Button>
      ),
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={!restoring && !restoreError && !signedIn}>
        <Stack.Screen name="login" options={{ title: 'Logga in', headerBackVisible: false }} />
        <Stack.Screen name="register" options={{ title: 'Skapa konto' }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="expenses" options={{ title: 'Utgifter', headerBackVisible: false }} />
        <Stack.Screen name="expenses/[id]" options={{ title: 'Utgiftsdetaljer' }} />
        <Stack.Screen name="expenses/form" options={{ title: 'Ny utgift' }} />
      </Stack.Protected>
      <Stack.Protected guard={false}>
        <Stack.Screen name="modal" />
      </Stack.Protected>
    </Stack>
  );
}
