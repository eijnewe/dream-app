import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Text } from '@/components/ui/text';
import { ActivityIndicator } from 'react-native';

export function ExpenseMessage({ message, loading, retry }: {
  message: string;
  loading?: boolean;
  retry?: () => void;
}) {
  return (
    <Center className="flex-1 gap-3 px-6">
      {loading && <ActivityIndicator />}
      <Text accessibilityRole={retry ? 'alert' : undefined}>{message}</Text>
      {retry && (
        <Button onPress={retry}>
          <ButtonText>Försök igen</ButtonText>
        </Button>
      )}
    </Center>
  );
}
