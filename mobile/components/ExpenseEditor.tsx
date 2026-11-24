import { ExpenseCategory } from '@/components/ExpenseCategory';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ApiError } from '@/lib/api';
import { expenseCategories, parseExpenseAmount, type Expense } from '@/lib/expenses';
import { useSession } from '@/lib/session';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const fieldClassName = 'rounded-md border border-border px-3 text-foreground';

export function ExpenseEditor({ expense }: { expense?: Expense }) {
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const { request } = useSession();
  const submitting = useRef(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState(expense ? String(expense.amount).replace('.', ',') : '');
  const [category, setCategory] = useState<Expense['category'] | null>(expense?.category ?? null);
  const [description, setDescription] = useState(expense?.description ?? '');
  const [error, setError] = useState('');

  function close() {
    if (expense) {
      router.dismissTo({ pathname: '/expenses/[id]', params: { id: String(expense.id) } });
    } else {
      router.dismissTo('/expenses');
    }
  }

  async function save() {
    if (submitting.current) return;
    const value = parseExpenseAmount(amount);
    if (value === null) {
      setError('Ange ett belopp mellan 0,01 och 9 999 999 999,99 kr med högst två decimaler.');
      return;
    }
    if (!category || !expenseCategories.includes(category)) {
      setError('Välj en kategori.');
      return;
    }
    if (description.length > 255) {
      setError('Beskrivningen får ha högst 255 tecken.');
      return;
    }

    submitting.current = true;
    Keyboard.dismiss();
    setSaving(true);
    setError('');

    try {
      await request(expense ? `/expenses/${expense.id}` : '/expenses', {
        method: expense ? 'PUT' : 'POST',
        body: { amount: value, category, description },
      });
      if (navigation.isFocused()) {
        close();
        Alert.alert(expense ? 'Ändringarna sparades' : 'Utgiften sparades');
      }
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status === 404
        ? 'Utgiften finns inte längre.'
        : 'Utgiften kunde inte sparas. Försök igen.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <Box className="flex-1 bg-background">
      <Stack.Screen options={{
        title: expense ? 'Redigera utgift' : 'Ny utgift',
        headerLeft: () => (
          <Button variant="ghost" size="sm" isDisabled={saving} onPress={close}>
            <ButtonText>Tillbaka</ButtonText>
          </Button>
        ),
      }} />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={headerHeight}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <VStack space="lg" className="px-6 py-6">
              <VStack space="xs">
                <Text bold>Belopp (kr)</Text>
                <TextInput
                  accessibilityLabel="Belopp i kronor"
                  className={`${fieldClassName} min-h-12`}
                  editable={!saving}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </VStack>
              <VStack space="xs" accessibilityRole="radiogroup">
                <Text bold>Kategori</Text>
                {expenseCategories.map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: category === option, disabled: saving }}
                    disabled={saving}
                    onPress={() => setCategory(option)}
                    className={category === option
                      ? 'rounded-md border border-primary bg-accent p-3'
                      : 'rounded-md border border-border p-3'}
                  >
                    <ExpenseCategory category={option} />
                  </Pressable>
                ))}
              </VStack>
              <VStack space="xs">
                <Text bold>Beskrivning (valfritt)</Text>
                <TextInput
                  accessibilityLabel="Beskrivning"
                  className={`${fieldClassName} min-h-20 py-3`}
                  editable={!saving}
                  maxLength={255}
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </VStack>
              {!!error && <Text accessibilityRole="alert" className="text-destructive">{error}</Text>}
              <Button isDisabled={saving} onPress={() => void save()}>
                <ButtonText>{saving ? 'Sparar …' : 'Spara'}</ButtonText>
              </Button>
              <Button variant="outline" isDisabled={saving} onPress={close}>
                <ButtonText>Avbryt</ButtonText>
              </Button>
            </VStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Box>
  );
}
