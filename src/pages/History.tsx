import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { formatMonthYear, formatDisplayDate, getMonthRange } from '../lib/date';
import MonthNavigator from '../components/MonthNavigator';
import ExpenseCard from '../components/ExpenseCard';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { getCategoryDef } from '../constants/categories';
import type { Expense, CategoryTotal, CustomCategory } from '../types/expense';

export default function History() {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);

  const availableYears: number[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) availableYears.push(y);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = getMonthRange(month, year);
      const [expRes, catRes, customCatRes] = await Promise.all([
        supabase.from('expenses').select('*').gte('expense_date', range.start).lte('expense_date', range.end).order('expense_date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('expenses').select('category, amount').gte('expense_date', range.start).lte('expense_date', range.end),
        supabase.from('custom_categories').select('*'),
      ]);

      if (expRes.error) throw expRes.error;
      if (catRes.error) throw catRes.error;
      if (customCatRes.error) throw customCatRes.error;
      setCustomCats((customCatRes.data ?? []) as CustomCategory[]);

      const expData = (expRes.data ?? []) as Expense[];
      setExpenses(expData);
      setMonthTotal(expData.reduce((s, r) => s + Number(r.amount), 0));

      const catMap = new Map<string, { total: number; count: number }>();
      (catRes.data ?? []).forEach((r) => {
        const existing = catMap.get(r.category) ?? { total: 0, count: 0 };
        existing.total += Number(r.amount);
        existing.count += 1;
        catMap.set(r.category, existing);
      });
      setCategoryTotals(
        Array.from(catMap.entries())
          .map(([category, v]) => ({ category, total: v.total, count: v.count }))
          .sort((a, b) => b.total - a.total)
      );
    } catch (err) {
      console.error(err);
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('expense-changed', handler);
    return () => window.removeEventListener('expense-changed', handler);
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    const { error: delErr } = await supabase.from('expenses').delete().eq('id', id);
    if (delErr) { alert('Failed to delete expense.'); return; }
    fetchData();
  };

  const handleEdit = (expense: Expense) => {
    navigate(`/add-expense?editId=${expense.id}&editAmount=${expense.amount}&editCategory=${expense.category}&editNote=${encodeURIComponent(expense.note ?? '')}&editDate=${expense.expense_date}`);
  };

  const groupedSections = groupByDate(expenses);
  const maxCatTotal = categoryTotals.length > 0 ? categoryTotals[0].total : 0;
  const allCatsData = customCats;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-title">History</div>
        <button className="add-btn" onClick={() => navigate('/add-expense')}>
          <Plus color="var(--text-inverse)" size={22} strokeWidth={2.5} />
        </button>
      </div>

      <MonthNavigator month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />

      <button className="year-picker" onClick={() => setShowYearPicker(!showYearPicker)}>
        Year: {year} <ChevronDown color="var(--text-secondary)" size={16} strokeWidth={2} />
      </button>

      {showYearPicker && (
        <div className="year-list">
          {availableYears.map((y) => (
            <button
              key={y}
              className={`year-item ${y === year ? 'year-item-selected' : ''}`}
              onClick={() => { setYear(y); setShowYearPicker(false); }}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          <div className="summary-card">
            <div className="summary-label">Total for {formatMonthYear(month, year)}</div>
            <div className="summary-amount">{formatCurrency(monthTotal)}</div>
            <div className="summary-count">{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</div>
          </div>

          {categoryTotals.length > 0 && (
            <div className="cat-summary">
              {categoryTotals.map((cat) => {
                const def = getCategoryDef(cat.category, allCatsData);
                const Icon = def.icon;
                const pct = maxCatTotal > 0 ? (cat.total / maxCatTotal) * 100 : 0;
                return (
                  <div key={cat.category} className="cat-summary-row">
                    <div className="cat-icon" style={{ backgroundColor: def.color + '20' }}>
                      <Icon color={def.color} size={14} strokeWidth={2} />
                    </div>
                    <div className="category-info">
                      <div className="category-top-row">
                        <span className="category-name" style={{ fontSize: 13 }}>{def.label}</span>
                        <span className="category-amount" style={{ fontSize: 13 }}>{formatCurrency(cat.total)}</span>
                      </div>
                      <div className="cat-bar">
                        <div className="cat-bar-fill" style={{ width: `${pct}%`, backgroundColor: def.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <div className="section-title">All Expenses</div>
            {expenses.length === 0 ? (
              <EmptyState title="No expenses this month" subtitle="Switch months or add a new expense" icon={Receipt} />
            ) : (
              groupedSections.map((section) => (
                <div key={section.title}>
                  <div className="date-header">{section.title}</div>
                  {section.data.map((expense) => (
                    <ExpenseCard key={expense.id} expense={expense} onEdit={handleEdit} onDelete={handleDelete} customCats={allCatsData} />
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function groupByDate(expenses: Expense[]): { title: string; data: Expense[] }[] {
  const groups = new Map<string, Expense[]>();
  expenses.forEach((e) => {
    const list = groups.get(e.expense_date) ?? [];
    list.push(e);
    groups.set(e.expense_date, list);
  });
  return Array.from(groups.entries()).map(([date, items]) => ({
    title: formatDisplayDate(date),
    data: items,
  }));
}
