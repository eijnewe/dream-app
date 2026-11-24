import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Expense } from '@/lib/expenses';
import { Bus, Ellipsis, ShoppingBag, Utensils } from 'lucide-react-native';

const categoryIcons = {
  Mat: Utensils,
  Transport: Bus,
  Shopping: ShoppingBag,
  Övrigt: Ellipsis,
};

export function ExpenseCategory({ category }: { category: Expense['category'] }) {
  return (
    <HStack space="sm" className="items-center">
      <Icon as={categoryIcons[category] ?? Ellipsis} size="md" className="text-primary" />
      <Text bold>{category}</Text>
    </HStack>
  );
}
