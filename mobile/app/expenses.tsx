import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useSession } from '@/lib/session';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Expenses() {
  const { signOut } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function logout() {
    setLoading(true);
    setError(false);
    try {
      await signOut();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <Box className="gap-4 px-6 py-8">
          <Heading size="2xl">Utgifter</Heading>
          <Text>Du är inloggad.</Text>
          {error && <Text accessibilityRole="alert" className="text-destructive">Utloggningen misslyckades. Försök igen.</Text>}
          <Button variant="outline" isDisabled={loading} onPress={() => void logout()}>
            <ButtonText>{loading ? 'Loggar ut …' : 'Logga ut'}</ButtonText>
          </Button>
        </Box>
      </SafeAreaView>
    </Box>
  );
}
