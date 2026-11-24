export const expenseCategories = ['Mat', 'Transport', 'Shopping', 'Övrigt'] as const;

export type ExpenseCategory = typeof expenseCategories[number];

export type Expense = {
  id: number;
  user_id: number;
  amount: number | string;
  category: ExpenseCategory;
  description: string;
  created_at: string;
};

export function expensePath(id: unknown) {
  return typeof id === 'string' && /^[1-9]\d*$/.test(id) && Number(id) <= 2147483647
    ? `/expenses/${id}`
    : null;
}

export function parseExpenseAmount(value: string) {
  const input = value.trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(input)) return null;

  const amount = Number(input.replace(',', '.'));
  return amount > 0 && amount <= 9999999999.99 ? amount : null;
}

const currency = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' });
const date = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' });
const dateTime = new Intl.DateTimeFormat('sv-SE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatAmount(amount: Expense['amount']) {
  return currency.format(Number(amount));
}

export function totalAmount(expenses: Expense[]) {
  const ore = expenses.reduce((total, expense) => total + Math.round(Number(expense.amount) * 100), 0);
  return ore / 100;
}

export function formatExpenseDate(createdAt: string) {
  return date.format(new Date(createdAt));
}

export function formatExpenseDateTime(createdAt: string) {
  return dateTime.format(new Date(createdAt));
}
