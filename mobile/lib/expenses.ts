export type Expense = {
  id: number;
  user_id: number;
  amount: number | string;
  category: 'Mat' | 'Transport' | 'Shopping' | 'Övrigt';
  description: string;
  created_at: string;
};

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
