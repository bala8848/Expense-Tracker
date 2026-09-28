import { useState, useCallback, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatCompactCurrency } from '../lib/currency';
import { getMonthName, getYearRange } from '../lib/date';
import { getCategoryDef } from '../constants/categories';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import type { CategoryTotal } from '../types/expense';

export default function Stats() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const [monthlyTotals, setMonthlyTotals] = useState<number[]>(new Array(12).fill(0));
  const [yearTotal, setYearTotal] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = getYearRange(year);
      const [yearRes, catRes] = await Promise.all([
        supabase.from('expenses').select('amount, expense_date').gte('expense_date', range.start).lte('expense_date', range.end),
        supabase.from('expenses').select('category, amount').gte('expense_date', range.start).lte('expense_date', range.end),
      ]);

      if (yearRes.error) throw yearRes.error;
      if (catRes.error) throw catRes.error;

      const monthTotals = new Array(12).fill(0);
      (yearRes.data ?? []).forEach((r) => {
        const m = new Date(r.expense_date + 'T00:00:00').getMonth();
        monthTotals[m] += Number(r.amount);
      });
      setMonthlyTotals(monthTotals);
      setYearTotal(monthTotals.reduce((s, v) => s + v, 0));

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
      setError('Failed to load stats.');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('expense-changed', handler);
    return () => window.removeEventListener('expense-changed', handler);
  }, [fetchData]);

  const maxMonthTotal = Math.max(...monthlyTotals, 1);
  const maxCatTotal = categoryTotals.length > 0 ? categoryTotals[0].total : 0;
  const avgMonthly = yearTotal / (now.getFullYear() === year ? now.getMonth() + 1 : 12);
  const activeMonths = monthlyTotals.filter((v) => v > 0).length;
  const highestMonthIdx = monthlyTotals.indexOf(maxMonthTotal);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-title">Statistics</div>
      </div>

      <div className="year-nav">
        <button className="year-nav-btn" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft color="var(--text-secondary)" size={24} strokeWidth={2} />
        </button>
        <span className="year-nav-label">{year}</span>
        <button className="year-nav-btn" onClick={() => setYear((y) => Math.min(y + 1, now.getFullYear()))} disabled={year >= now.getFullYear()}>
          <ChevronRight color={year >= now.getFullYear() ? 'var(--text-tertiary)' : 'var(--text-secondary)'} size={24} strokeWidth={2} />
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : yearTotal === 0 ? (
        <EmptyState title={`No data for ${year}`} subtitle="Add expenses to see your spending trends" icon={BarChart3} />
      ) : (
        <>
          <div className="stats-summary-row">
            <div className="stats-summary-card">
              <div className="stats-summary-label">Year Total</div>
              <div className="stats-summary-value">{formatCompactCurrency(yearTotal)}</div>
            </div>
            <div className="stats-summary-card">
              <div className="stats-summary-label">Monthly Avg</div>
              <div className="stats-summary-value">{formatCompactCurrency(avgMonthly)}</div>
            </div>
            <div className="stats-summary-card">
              <div className="stats-summary-label">Active Months</div>
              <div className="stats-summary-value">{activeMonths}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <div className="stats-card-icon">
                <TrendingUp color="var(--primary)" size={18} strokeWidth={2} />
              </div>
              <div className="stats-card-title">Monthly Spending — {year}</div>
            </div>
            <div className="bar-chart">
              {monthlyTotals.map((total, idx) => {
                const heightPct = (total / maxMonthTotal) * 100;
                const isHighest = idx === highestMonthIdx && total > 0;
                return (
                  <div key={idx} className="bar-column">
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          height: `${Math.max(heightPct, total > 0 ? 4 : 0)}%`,
                          backgroundColor: isHighest ? 'var(--primary)' : 'var(--primary-light)',
                        }}
                      />
                    </div>
                    <div className={`bar-label ${isHighest ? 'bar-label-active' : ''}`}>
                      {getMonthName(idx).charAt(0)}
                    </div>
                    {total > 0 && <div className="bar-value">{formatCompactCurrency(total)}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <div className="stats-card-icon">
                <Calendar color="var(--primary)" size={18} strokeWidth={2} />
              </div>
              <div className="stats-card-title">Category Breakdown — {year}</div>
            </div>
            {categoryTotals.map((cat) => {
              const def = getCategoryDef(cat.category);
              const Icon = def.icon;
              const pct = (cat.total / yearTotal) * 100;
              const barPct = maxCatTotal > 0 ? (cat.total / maxCatTotal) * 100 : 0;
              return (
                <div key={cat.category} className="stats-cat-row">
                  <div className="stats-cat-icon" style={{ backgroundColor: def.color + '20' }}>
                    <Icon color={def.color} size={16} strokeWidth={2} />
                  </div>
                  <div className="stats-cat-info">
                    <div className="stats-cat-top-row">
                      <span className="stats-cat-name">{def.label}</span>
                      <span className="stats-cat-pct">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="stats-cat-bar">
                      <div className="stats-cat-bar-fill" style={{ width: `${barPct}%`, backgroundColor: def.color }} />
                    </div>
                    <div className="stats-cat-bottom-row">
                      <span className="stats-cat-count">{cat.count} {cat.count === 1 ? 'expense' : 'expenses'}</span>
                      <span className="stats-cat-amount">{formatCurrency(cat.total)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
