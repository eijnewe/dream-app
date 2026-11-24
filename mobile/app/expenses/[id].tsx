import { ExpenseCategory } from '@/components/ExpenseCategory';
import { ExpenseMessage } from '@/components/ExpenseMessage';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ApiError } from '@/lib/api';
import { expensePath, formatAmount, formatExpenseDateTime, type Expense } from '@/lib/expenses';
import { useSession } from '@/lib/session';
import { useExpenseData } from '@/lib/use-expense-data';
import { Link, Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExpenseDetails() {
  const router = useRouter();
  const navigation = useNavigation();
  const { request } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const path = expensePath(id);
  const { state, retry } = useExpenseData<Expense>(path);
  const removing = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function removeExpense() {
    if (!path || removing.current) return;
    removing.current = true;
    setDeleting(true);
    setDeleteError('');

    try {
      await request<void>(path, { method: 'DELETE' });
      if (navigation.isFocused()) {
        router.dismissTo('/expenses');
        Alert.alert('Utgiften raderades');
      }
    } catch (error) {
      setDeleteError(error instanceof ApiError && error.status === 404
        ? 'Utgiften finns inte längre.'
        : 'Utgiften kunde inte raderas. Försök igen.');
    } finally {
      removing.current = false;
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Radera utgift?', 'Utgiften tas bort permanent.', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Radera', style: 'destructive', onPress: () => void removeExpense() },
    ]);
  }

  return (
    <Box className="flex-1 bg-background">
      <Stack.Screen options={{
        headerLeft: () => (
          <Button variant="ghost" size="sm" isDisabled={deleting} onPress={() => router.dismissTo('/expenses')}>
            <ButtonText>Till utgifter</ButtonText>
          </Button>
        ),
      }} />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
        {!path || (state.status === 'error' && state.notFound) ? (
          <ExpenseMessage message="Utgiften hittades inte." />
        ) : state.status === 'loading' ? (
          <ExpenseMessage loading message="Hämtar utgiften …" />
        ) : state.status === 'error' ? (
          <ExpenseMessage message="Utgiften kunde inte hämtas." retry={retry} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <VStack space="md">
              <VStack space="sm" className="rounded-lg border border-border bg-card p-4">
                <Heading size="xl" className="text-primary">{formatAmount(state.data.amount)}</Heading>
                <ExpenseCategory category={state.data.category} />
                <Text>{formatExpenseDateTime(state.data.created_at)}</Text>
                <Text>{state.data.description || 'Ingen beskrivning'}</Text>
              </VStack>
              <Link href={{ pathname: '/expenses/form', params: { id } }} asChild>
                <Button isDisabled={deleting}>
                  <ButtonText>Redigera</ButtonText>
                </Button>
              </Link>
              <Button variant="destructive" isDisabled={deleting} onPress={confirmDelete}>
                <ButtonText>{deleting ? 'Raderar …' : 'Radera'}</ButtonText>
              </Button>
              {!!deleteError && (
                <Text accessibilityRole="alert" className="text-destructive">{deleteError}</Text>
              )}
            </VStack>
          </ScrollView>
        )}
      </SafeAreaView>
    </Box>
  );
}
