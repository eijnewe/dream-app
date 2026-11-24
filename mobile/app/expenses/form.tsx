import { ExpenseEditor } from '@/components/ExpenseEditor';
import { ExpenseMessage } from '@/components/ExpenseMessage';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';
import { expensePath, type Expense } from '@/lib/expenses';
import { useExpenseData } from '@/lib/use-expense-data';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExpenseForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id !== undefined;
  const path = expensePath(id);
  const { state, retry } = useExpenseData<Expense>(path);

  if (!editing) return <ExpenseEditor />;
  if (state.status === 'success') {
    return <ExpenseEditor key={state.data.id} expense={state.data} />;
  }

  return (
    <Box className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <VStack space="sm" className="items-start px-6 pb-4 pt-12">
          <Button variant="outline" onPress={() => router.dismissTo('/expenses')}>
            <ButtonText>Till utgifter</ButtonText>
          </Button>
          <Heading size="2xl">Redigera utgift</Heading>
        </VStack>
        {!path || (state.status === 'error' && state.notFound) ? (
          <ExpenseMessage message="Utgiften hittades inte." />
        ) : state.status === 'error' ? (
          <ExpenseMessage message="Utgiften kunde inte hämtas." retry={retry} />
        ) : (
          <ExpenseMessage loading message="Hämtar utgiften …" />
        )}
      </SafeAreaView>
    </Box>
  );
}
