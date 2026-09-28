import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Calendar, Receipt, ChevronRight, Wallet, PiggyBank, Repeat } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatCompactCurrency } from '../lib/currency';
import { formatMonthYear, getMonthRange, todayDateStr } from '../lib/date';
import { getCategoryDef } from '../constants/categories';
import ExpenseCard from '../components/ExpenseCard';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import type { Expense, CategoryTotal, BudgetSettings, RecurringExpense, CustomCategory } from '../types/expense';

export default function Home() {
  const navigate = useNavigate();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const [monthTotal, setMonthTotal] = useState<number | null>(null);
  const [todayTotal, setTodayTotal] = useState<number | null>(null);
  const [prevMonthTotal, setPrevMonthTotal] = useState<number | null>(null);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<BudgetSettings | null>(null);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allCatsData = [
    ...[{ name: 'Food', color: '#F59E0B' }, { name: 'Transport', color: '#3B82F6' }, { name: 'Shopping', color: '#EC4899' }, { name: 'Bills', color: '#8B5CF6' }, { name: 'Health', color: '#EF4444' }, { name: 'Entertainment', color: '#06B6D4' }, { name: 'Education', color: '#10B981' }, { name: 'Travel', color: '#F97316' }, { name: 'Electronics', color: '#6366F1' }, { name: 'Gifts', color: '#D946EF' }, { name: 'Income', color: '#22C55E' }, { name: 'Other', color: '#64748B' }],
    ...customCats.map((c) => ({ name: c.name, color: c.color })),
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const monthRange = getMonthRange(currentMonth, currentYear);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevRange = getMonthRange(prevMonth, prevYear);
      const today = todayDateStr();

      const [monthRes, todayRes, prevRes, catRes, recentRes, budgetRes, recurringRes, customCatRes] = await Promise.all([
        supabase.from('expenses').select('amount').gte('expense_date', monthRange.start).lte('expense_date', monthRange.end),
        supabase.from('expenses').select('amount').eq('expense_date', today),
        supabase.from('expenses').select('amount').gte('expense_date', prevRange.start).lte('expense_date', prevRange.end),
        supabase.from('expenses').select('category, amount').gte('expense_date', monthRange.start).lte('expense_date', monthRange.end),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }).order('created_at', { ascending: false }).limit(5),
        supabase.from('budget_settings').select('*').maybeSingle(),
        supabase.from('recurring_expenses').select('*').eq('active', true).order('due_day', { ascending: true }),
        supabase.from('custom_categories').select('*'),
      ]);

      if (monthRes.error) throw monthRes.error;
      if (todayRes.error) throw todayRes.error;
      if (prevRes.error) throw prevRes.error;
      if (catRes.error) throw catRes.error;
      if (recentRes.error) throw recentRes.error;
      if (budgetRes.error) throw budgetRes.error;
      if (recurringRes.error) throw recurringRes.error;
      if (customCatRes.error) throw customCatRes.error;

      setMonthTotal((monthRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0));
      setTodayTotal((todayRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0));
      setPrevMonthTotal((prevRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0));

      const catMap = new Map<string, { total: number; count: number }>();
      (catRes.data ?? []).forEach((r) => {
        const existing = catMap.get(r.category) ?? { total: 0, count: 0 };
        existing.total += Number(r.amount);
        existing.count += 1;
        catMap.set(r.category, existing);
      });
      setCategoryTotals(
        Array.from(catMap.entries()).map(([category, v]) => ({ category, total: v.total, count: v.count })).sort((a, b) => b.total - a.total)
      );

      setRecentExpenses((recentRes.data ?? []) as Expense[]);
      setBudget(budgetRes.data as BudgetSettings | null);
      setRecurring((recurringRes.data ?? []) as RecurringExpense[]);
      setCustomCats((customCatRes.data ?? []) as CustomCategory[]);
    } catch (err) {
      console.error(err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header">
          <div><div className="page-header-greeting">Welcome back</div><div className="page-header-title">Expense Tracker</div></div>
        </div>
        <LoadingState />
      </div>
    );
  }

  const monthLabel = formatMonthYear(currentMonth, currentYear);
  const changePercent = prevMonthTotal && prevMonthTotal > 0 ? ((monthTotal ?? 0) - prevMonthTotal) / prevMonthTotal * 100 : null;
  const isIncrease = (monthTotal ?? 0) > (prevMonthTotal ?? 0);
  const maxCatTotal = categoryTotals.length > 0 ? categoryTotals[0].total : 0;
  const monthlyBudget = budget?.monthly_budget ?? 0;
  const remaining = monthlyBudget - (monthTotal ?? 0);
  const spentPct = monthlyBudget > 0 ? Math.min(((monthTotal ?? 0) / monthlyBudget) * 100, 100) : 0;
  const isOverBudget = remaining < 0;
  const recurringTotal = recurring.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-header-greeting">Welcome back</div>
          <div className="page-header-title">Expense Tracker</div>
        </div>
        <button className="add-btn" onClick={() => navigate('/add-expense')}>
          <Plus color="var(--text-inverse)" size={22} strokeWidth={2.5} />
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={fetchData} />}

      {monthlyBudget > 0 && (
        <div className="budget-mini-card" onClick={() => navigate('/budget')}>
          <div className="budget-mini-info">
            <div className="budget-mini-label">Budget Status</div>
            <div className="budget-mini-amount">{formatCurrency(remaining)} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-tertiary)' }}>remaining</span></div>
            <div className="budget-mini-bar">
              <div className="budget-mini-bar-fill" style={{ width: `${spentPct}%`, background: isOverBudget ? 'var(--error)' : 'var(--primary)' }} />
            </div>
          </div>
          <ChevronRight color="var(--text-tertiary)" size={20} strokeWidth={2} />
        </div>
      )}

      <div className="hero-card">
        <div className="hero-top">
          <div>
            <div className="hero-label">This Month</div>
            <div className="hero-month">{monthLabel}</div>
          </div>
          {changePercent !== null && (
            <div className={`change-badge ${isIncrease ? 'change-badge-up' : 'change-badge-down'}`}>
              {isIncrease ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
              {isIncrease ? '+' : ''}{changePercent.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="hero-amount">{formatCurrency(monthTotal ?? 0)}</div>
        <div className="hero-stats">
          <div className="hero-stat-item">
            <Calendar color="var(--primary-light)" size={16} strokeWidth={2} />
            <div className="hero-stat-label">Today</div>
            <div className="hero-stat-value">{formatCompactCurrency(todayTotal ?? 0)}</div>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <Receipt color="var(--primary-light)" size={16} strokeWidth={2} />
            <div className="hero-stat-label">Last Month</div>
            <div className="hero-stat-value">{formatCompactCurrency(prevMonthTotal ?? 0)}</div>
          </div>
        </div>
      </div>

      {recurring.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div className="section-title" style={{ marginBottom: 0 }}>Recurring Expenses</div>
            <button className="see-all-btn" onClick={() => navigate('/recurring')}>
              See All <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="recurring-mini-card" onClick={() => navigate('/recurring')}>
            <div className="expense-icon-wrap" style={{ backgroundColor: 'var(--primary-50)' }}>
              <Repeat color="var(--primary)" size={20} strokeWidth={2} />
            </div>
            <div className="expense-info">
              <div className="expense-category">{recurring.length} active recurring {recurring.length === 1 ? 'expense' : 'expenses'}</div>
              <div className="expense-note">Total: {formatCurrency(recurringTotal)} / month</div>
            </div>
            <ChevronRight color="var(--text-tertiary)" size={20} strokeWidth={2} />
          </div>
        </div>
      )}

      {categoryTotals.length > 0 && (
        <div className="section">
          <div className="section-title">Spending by Category</div>
          <div className="category-list">
            {categoryTotals.slice(0, 5).map((cat) => {
              const def = getCategoryDef(cat.category, allCatsData);
              const Icon = def.icon;
              const pct = maxCatTotal > 0 ? (cat.total / maxCatTotal) * 100 : 0;
              return (
                <div key={cat.category} className="category-row">
                  <div className="category-icon-sm" style={{ backgroundColor: def.color + '20' }}>
                    <Icon color={def.color} size={16} strokeWidth={2} />
                  </div>
                  <div className="category-info">
                    <div className="category-top-row">
                      <span className="category-name">{def.label}</span>
                      <span className="category-amount">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="category-bar">
                      <div className="category-bar-fill" style={{ width: `${pct}%`, backgroundColor: def.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-header">
          <div className="section-title" style={{ marginBottom: 0 }}>Recent Expenses</div>
          <button className="see-all-btn" onClick={() => navigate('/history')}>
            See All <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
        {recentExpenses.length === 0 ? (
          <EmptyState title="No expenses yet" subtitle="Tap the + button to add your first expense" icon={Receipt} />
        ) : (
          recentExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} onEdit={handleEdit} onDelete={handleDelete} showDate customCats={allCatsData} />
          ))
        )}
      </div>
    </div>
  );
}
