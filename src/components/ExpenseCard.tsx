import { Pencil, Trash2 } from 'lucide-react';
import { getCategoryDef } from '../constants/categories';
import { formatCurrency } from '../lib/currency';
import { formatShortDate } from '../lib/date';
import type { Expense } from '../types/expense';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  showDate?: boolean;
  customCats?: { name: string; color: string }[];
}

export default function ExpenseCard({ expense, onEdit, onDelete, showDate = false, customCats = [] }: ExpenseCardProps) {
  const cat = getCategoryDef(expense.category, customCats);
  const Icon = cat.icon;

  return (
    <div className="expense-card">
      <div className="expense-icon-wrap" style={{ backgroundColor: cat.color + '20' }}>
        <Icon color={cat.color} size={20} strokeWidth={2} />
      </div>
      <div className="expense-info">
        <div className="expense-category">{cat.label}</div>
        {expense.note ? (
          <div className="expense-note">{expense.note}</div>
        ) : (
          <div className="expense-note-placeholder">No note</div>
        )}
        {showDate && <div className="expense-date">{formatShortDate(expense.expense_date)}</div>}
      </div>
      <div className="expense-amount">{formatCurrency(expense.amount)}</div>
      {(onEdit || onDelete) && (
        <div className="expense-actions">
          {onEdit && (
            <button className="expense-action-btn" onClick={() => onEdit(expense)}>
              <Pencil color="var(--text-tertiary)" size={16} strokeWidth={2} />
            </button>
          )}
          {onDelete && (
            <button className="expense-action-btn" onClick={() => onDelete(expense.id)}>
              <Trash2 color="var(--error)" size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
