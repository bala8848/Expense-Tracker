import { useState, useCallback, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { formatMonthYear, getMonthRange } from '../lib/date';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import type { BudgetSettings } from '../types/expense';

export default function Budget() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [budget, setBudget] = useState<BudgetSettings | null>(null);
  const [monthSpent, setMonthSpent] = useState(0);
  const [recurringTotal, setRecurringTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = getMonthRange(currentMonth, currentYear);

      const [budgetRes, spentRes, recurringRes] = await Promise.all([
        supabase.from('budget_settings').select('*').maybeSingle(),
        supabase.from('expenses').select('amount').gte('expense_date', range.start).lte('expense_date', range.end),
        supabase.from('recurring_expenses').select('amount').eq('active', true),
      ]);

      if (budgetRes.error) throw budgetRes.error;
      if (spentRes.error) throw spentRes.error;
      if (recurringRes.error) throw recurringRes.error;

      setBudget(budgetRes.data as BudgetSettings | null);
      setMonthSpent((spentRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0));
      setRecurringTotal((recurringRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0));
    } catch (err) {
      console.error(err);
      setError('Failed to load budget data.');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('expense-changed', handler);
    return () => window.removeEventListener('expense-changed', handler);
  }, [fetchData]);

  const handleSaveBudget = async () => {
    const numAmount = parseFloat(budgetInput);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid budget amount.');
      return;
    }

    setSaving(true);
    try {
      if (budget) {
        const { data, error } = await supabase
          .from('budget_settings')
          .update({ monthly_budget: numAmount, updated_at: new Date().toISOString() })
          .eq('id', budget.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) setBudget(data as BudgetSettings);
      } else {
        const { data, error } = await supabase
          .from('budget_settings')
          .insert({ monthly_budget: numAmount })
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) setBudget(data as BudgetSettings);
      }
      setEditingBudget(false);
      window.dispatchEvent(new Event('expense-changed'));
    } catch (err) {
      alert('Failed to save budget.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const monthlyBudget = budget?.monthly_budget ?? 0;
  const remaining = monthlyBudget - monthSpent;
  const spentPct = monthlyBudget > 0 ? (monthSpent / monthlyBudget) * 100 : 0;
  const isOverBudget = remaining < 0;
  const monthLabel = formatMonthYear(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header"><div className="page-header-title">Budget</div></div>
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-title">Budget</div>
      </div>

      {error && <ErrorState message={error} onRetry={fetchData} />}

      <div className="month-nav">
        <button className="month-nav-btn" onClick={prevMonth}>‹</button>
        <span className="month-nav-label">{monthLabel}</span>
        <button className="month-nav-btn" onClick={nextMonth}>›</button>
      </div>

      {!editingBudget ? (
        <div className="budget-hero-card" style={{ background: isOverBudget ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
          <div className="budget-hero-top">
            <div>
              <div className="budget-hero-label">Monthly Budget</div>
              <div className="budget-hero-amount">{formatCurrency(monthlyBudget)}</div>
            </div>
            <button className="budget-edit-btn" onClick={() => { setBudgetInput(String(monthlyBudget || '')); setEditingBudget(true); }}>
              {monthlyBudget > 0 ? 'Edit' : 'Set'}
            </button>
          </div>

          {monthlyBudget > 0 && (
            <>
              <div className="budget-progress-section">
                <div className="budget-progress-bar">
                  <div
                    className="budget-progress-fill"
                    style={{
                      width: `${Math.min(spentPct, 100)}%`,
                      background: isOverBudget ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)',
                    }}
                  />
                </div>
                <div className="budget-progress-labels">
                  <span>Spent: {formatCurrency(monthSpent)}</span>
                  <span>{spentPct.toFixed(0)}%</span>
                </div>
              </div>

              <div className="budget-stats-row">
                <div className="budget-stat-item">
                  <TrendingDown color="rgba(255,255,255,0.8)" size={16} strokeWidth={2} />
                  <div className="budget-stat-label">Spent</div>
                  <div className="budget-stat-value">{formatCurrency(monthSpent)}</div>
                </div>
                <div className="budget-stat-item">
                  <PiggyBank color="rgba(255,255,255,0.8)" size={16} strokeWidth={2} />
                  <div className="budget-stat-label">Remaining</div>
                  <div className="budget-stat-value" style={{ color: isOverBudget ? '#FECACA' : '#FFFFFF' }}>{formatCurrency(remaining)}</div>
                </div>
                <div className="budget-stat-item">
                  <TrendingUp color="rgba(255,255,255,0.8)" size={16} strokeWidth={2} />
                  <div className="budget-stat-label">Recurring</div>
                  <div className="budget-stat-value">{formatCurrency(recurringTotal)}</div>
                </div>
              </div>
            </>
          )}

          {monthlyBudget === 0 && (
            <div className="budget-empty-hint">
              <Wallet color="rgba(255,255,255,0.6)" size={32} strokeWidth={1.5} />
              <div>Tap "Set" to define your monthly budget</div>
            </div>
          )}
        </div>
      ) : (
        <div className="budget-edit-card">
          <div className="form-label">Set Monthly Budget (INR)</div>
          <div className="budget-edit-input-row">
            <span className="currency-symbol">₹</span>
            <input
              className="amount-input"
              style={{ fontSize: 36 }}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              type="text"
              inputMode="decimal"
              autoFocus
            />
          </div>
          <div className="budget-edit-actions">
            <button className="budget-cancel-btn" onClick={() => setEditingBudget(false)}>Cancel</button>
            <button className="budget-save-btn" onClick={handleSaveBudget} disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 20, height: 20 }} /> : 'Save Budget'}
            </button>
          </div>
        </div>
      )}

      {monthlyBudget > 0 && (
        <div className="section">
          <div className="section-title">Budget Summary</div>
          <div className="budget-summary-card">
            <div className="budget-summary-row">
              <span className="budget-summary-label">Total Budget</span>
              <span className="budget-summary-value">{formatCurrency(monthlyBudget)}</span>
            </div>
            <div className="budget-summary-row">
              <span className="budget-summary-label">Total Spent</span>
              <span className="budget-summary-value" style={{ color: 'var(--error)' }}>{formatCurrency(monthSpent)}</span>
            </div>
            <div className="budget-summary-row">
              <span className="budget-summary-label">Remaining</span>
              <span className="budget-summary-value" style={{ color: isOverBudget ? 'var(--error)' : 'var(--success)' }}>{formatCurrency(remaining)}</span>
            </div>
            <div className="budget-summary-row">
              <span className="budget-summary-label">Recurring Expenses</span>
              <span className="budget-summary-value">{formatCurrency(recurringTotal)}</span>
            </div>
            <div className="budget-summary-row" style={{ borderBottom: 'none' }}>
              <span className="budget-summary-label">After Recurring</span>
              <span className="budget-summary-value">{formatCurrency(remaining - recurringTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
