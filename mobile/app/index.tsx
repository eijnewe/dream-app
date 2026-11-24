import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Text } from '@/components/ui/text';
import { useSession } from '@/lib/session';
import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';

export default function Home() {
  const { signedIn, restoring, restoreError, restore } = useSession();

  if (restoring) {
    return (
      <Center className="flex-1 bg-background gap-3">
        <ActivityIndicator color="#10b981" />
        <Text>Kontrollerar sessionen …</Text>
      </Center>
    );
  }

  if (restoreError) {
    return (
      <Center className="flex-1 bg-background gap-3 px-6">
        <Text accessibilityRole="alert">Sessionen kunde inte kontrolleras.</Text>
        <Button onPress={() => void restore()}>
          <ButtonText>Försök igen</ButtonText>
        </Button>
      </Center>
    );
  }

  return <Redirect href={signedIn ? '/expenses' : '/login'} />;
}
