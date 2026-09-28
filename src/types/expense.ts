export interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string | null;
  expense_date: string;
  created_at: string;
}

export interface ExpenseInput {
  amount: number;
  category: string;
  note?: string | null;
  expense_date: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export interface BudgetSettings {
  id: string;
  monthly_budget: number;
  updated_at: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  due_day: number;
  active: boolean;
  created_at: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}
