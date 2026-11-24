import { ExpenseCategory } from '@/components/ExpenseCategory';
import { ExpenseMessage } from '@/components/ExpenseMessage';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { formatAmount, formatExpenseDate, totalAmount, type Expense } from '@/lib/expenses';
import { useSession } from '@/lib/session';
import { useExpenseData } from '@/lib/use-expense-data';
import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Expenses() {
  const { signOut } = useSession();
  const { state, retry } = useExpenseData<Expense[]>('/expenses');
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  async function logout() {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      await signOut();
    } catch {
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <Box className="flex-1 bg-background">
      <Stack.Screen options={{
        headerLeft: () => (
          <Button variant="ghost" size="sm" isDisabled={loggingOut} onPress={() => void logout()}>
            <ButtonText>{loggingOut ? 'Loggar ut …' : 'Logga ut'}</ButtonText>
          </Button>
        ),
      }} />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
        <VStack space="sm" className="px-6 pb-4 pt-4">
          <Link href="/expenses/form" asChild>
            <Button>
              <ButtonText>Ny utgift</ButtonText>
            </Button>
          </Link>
          {logoutError && (
            <Text accessibilityRole="alert" className="text-destructive">
              Utloggningen misslyckades. Försök igen.
            </Text>
          )}
          {state.status === 'success' && (
            <VStack space="xs" className="rounded-lg bg-card p-4">
              <Text>Totalt</Text>
              <Heading size="2xl" className="text-primary">{formatAmount(totalAmount(state.data))}</Heading>
            </VStack>
          )}
        </VStack>
        {state.status === 'loading' && <ExpenseMessage loading message="Hämtar utgifter …" />}
        {state.status === 'error' && <ExpenseMessage message="Utgifterna kunde inte hämtas." retry={retry} />}
        {state.status === 'success' && (
          <FlatList
            data={state.data}
            keyExtractor={(expense) => String(expense.id)}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 16, gap: 8 }}
            ListEmptyComponent={<ExpenseMessage message="Du har inga utgifter ännu." />}
            renderItem={({ item }) => (
              <Link href={{ pathname: '/expenses/[id]', params: { id: String(item.id) } }} asChild>
                <Pressable accessibilityRole="link" className="rounded-lg border border-border bg-card p-4">
                  <HStack space="sm" className="items-center justify-between">
                    <VStack space="xs" className="flex-1">
                      <ExpenseCategory category={item.category} />
                      {!!item.description && <Text numberOfLines={1}>{item.description}</Text>}
                      <Text size="sm" className="text-muted-foreground">{formatExpenseDate(item.created_at)}</Text>
                    </VStack>
                    <Text bold>{formatAmount(item.amount)}</Text>
                  </HStack>
                </Pressable>
              </Link>
            )}
          />
        )}
      </SafeAreaView>
    </Box>
  );
}
