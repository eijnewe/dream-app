import { ExpenseCategory } from '@/components/ExpenseCategory';
import { ExpenseMessage } from '@/components/ExpenseMessage';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { formatAmount, formatExpenseDateTime, type Expense } from '@/lib/expenses';
import { useExpenseData } from '@/lib/use-expense-data';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExpenseDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const path = typeof id === 'string' && /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647
    ? `/expenses/${id}`
    : null;
  const { state, retry } = useExpenseData<Expense>(path);

  return (
    <Box className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <VStack space="sm" className="items-start px-6 pb-4 pt-12">
          <Button variant="outline" onPress={() => router.dismissTo('/expenses')}>
            <ButtonText>Till utgifter</ButtonText>
          </Button>
          <Heading size="2xl">Utgiftsdetaljer</Heading>
        </VStack>
        {!path || (state.status === 'error' && state.notFound) ? (
          <ExpenseMessage message="Utgiften hittades inte." />
        ) : state.status === 'loading' ? (
          <ExpenseMessage loading message="Hämtar utgiften …" />
        ) : state.status === 'error' ? (
          <ExpenseMessage message="Utgiften kunde inte hämtas." retry={retry} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
            <VStack space="sm" className="rounded-lg border border-border bg-card p-4">
              <Heading size="xl" className="text-primary">{formatAmount(state.data.amount)}</Heading>
              <ExpenseCategory category={state.data.category} />
              <Text>{formatExpenseDateTime(state.data.created_at)}</Text>
              <Text>{state.data.description || 'Ingen beskrivning'}</Text>
            </VStack>
          </ScrollView>
        )}
      </SafeAreaView>
    </Box>
  );
}
