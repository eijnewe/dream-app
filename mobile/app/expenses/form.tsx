import { ExpenseEditor } from '@/components/ExpenseEditor';
import { ExpenseMessage } from '@/components/ExpenseMessage';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { expensePath, type Expense } from '@/lib/expenses';
import { useExpenseData } from '@/lib/use-expense-data';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExpenseForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id !== undefined;
  const path = expensePath(id);
  const { state, retry } = useExpenseData<Expense>(path);

  if (!editing || state.status === 'success') {
    const expense = state.status === 'success' ? state.data : undefined;
    return <ExpenseEditor key={expense?.id} expense={expense} />;
  }

  return (
    <Box className="flex-1 bg-background">
      <Stack.Screen options={{
        title: 'Redigera utgift',
        headerLeft: () => (
          <Button variant="ghost" size="sm" onPress={() => router.dismissTo('/expenses')}>
            <ButtonText>Tillbaka</ButtonText>
          </Button>
        ),
      }} />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
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
