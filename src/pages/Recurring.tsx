import { useState, useCallback, useEffect } from 'react';
import { Plus, Repeat, Trash2, Pencil, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { BUILT_IN_CATEGORIES, getCategoryDef } from '../constants/categories';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import type { RecurringExpense, CustomCategory } from '../types/expense';

export default function Recurring() {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [dueDay, setDueDay] = useState('1');

  const allCats = [
    ...BUILT_IN_CATEGORIES.map((c) => ({ name: c.value, color: c.color })),
    ...customCats.map((c) => ({ name: c.name, color: c.color })),
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recRes, catRes] = await Promise.all([
        supabase.from('recurring_expenses').select('*').order('due_day', { ascending: true }),
        supabase.from('custom_categories').select('*'),
      ]);
      if (recRes.error) throw recRes.error;
      if (catRes.error) throw catRes.error;
      setItems((recRes.data ?? []) as RecurringExpense[]);
      setCustomCats((catRes.data ?? []) as CustomCategory[]);
    } catch (err) {
      console.error(err);
      setError('Failed to load recurring expenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('expense-changed', handler);
    return () => window.removeEventListener('expense-changed', handler);
  }, [fetchData]);

  const resetForm = () => {
    setName('');
    setAmount('');
    setCategory('Bills');
    setDueDay('1');
    setEditingId(null);
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!name.trim()) { alert('Please enter a name.'); return; }
    if (!numAmount || numAmount <= 0) { alert('Please enter a valid amount.'); return; }

    try {
      if (editingId) {
        const { error } = await supabase.from('recurring_expenses').update({
          name: name.trim(),
          amount: numAmount,
          category,
          due_day: parseInt(dueDay) || 1,
        }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recurring_expenses').insert({
          name: name.trim(),
          amount: numAmount,
          category,
          due_day: parseInt(dueDay) || 1,
        });
        if (error) throw error;
      }
      resetForm();
      setShowForm(false);
      window.dispatchEvent(new Event('expense-changed'));
      fetchData();
    } catch (err) {
      alert('Failed to save recurring expense.');
      console.error(err);
    }
  };

  const handleEdit = (item: RecurringExpense) => {
    setEditingId(item.id);
    setName(item.name);
    setAmount(String(item.amount));
    setCategory(item.category);
    setDueDay(String(item.due_day));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring expense?')) return;
    const { error: delErr } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (delErr) { alert('Failed to delete.'); return; }
    window.dispatchEvent(new Event('expense-changed'));
    fetchData();
  };

  const handleToggleActive = async (item: RecurringExpense) => {
    const { error } = await supabase.from('recurring_expenses').update({ active: !item.active }).eq('id', item.id);
    if (error) { alert('Failed to update.'); return; }
    fetchData();
  };

  const totalActive = items.filter((i) => i.active).reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-title">Default Spends</div>
        <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus color="var(--text-inverse)" size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className="summary-card" style={{ marginBottom: 16 }}>
        <div className="summary-label">Total Monthly Default Spends</div>
        <div className="summary-amount">{formatCurrency(totalActive)}</div>
        <div className="summary-count">{items.filter((i) => i.active).length} active default spend{items.filter((i) => i.active).length === 1 ? '' : 's'}</div>
      </div>

      {showForm && (
        <div className="recurring-form-card">
          <div className="recurring-form-header">
            <span className="recurring-form-title">{editingId ? 'Edit Recurring Expense' : 'Add Recurring Expense'}</span>
            <button onClick={() => { resetForm(); setShowForm(false); }}><X color="var(--text-secondary)" size={20} /></button>
          </div>
          <div className="recurring-form-body">
            <div className="recurring-form-field">
              <div className="form-label">Name</div>
              <input
                className="recurring-form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electricity Bill, Car EMI"
                autoFocus
              />
            </div>
            <div className="recurring-form-row">
              <div className="recurring-form-field" style={{ flex: 1 }}>
                <div className="form-label">Amount (₹)</div>
                <input
                  className="recurring-form-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  type="text"
                  inputMode="decimal"
                />
              </div>
              <div className="recurring-form-field" style={{ width: 100 }}>
                <div className="form-label">Due Day</div>
                <input
                  className="recurring-form-input"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                  placeholder="1"
                  type="text"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="recurring-form-field">
              <div className="form-label">Category</div>
              <select className="recurring-form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {allCats.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <button className="recurring-form-save" onClick={handleSave}>
              <Check size={18} strokeWidth={2.5} /> Save
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : items.length === 0 && !showForm ? (
        <EmptyState title="No recurring expenses" subtitle="Add default monthly expenses like EB bills, rent, car EMI" icon={Repeat} />
      ) : (
        items.map((item) => {
          const def = getCategoryDef(item.category, allCats);
          const Icon = def.icon;
          return (
            <div key={item.id} className={`recurring-card ${!item.active ? 'recurring-card-inactive' : ''}`}>
              <div className="expense-icon-wrap" style={{ backgroundColor: def.color + '20', opacity: item.active ? 1 : 0.4 }}>
                <Icon color={def.color} size={20} strokeWidth={2} />
              </div>
              <div className="expense-info">
                <div className="expense-category">{item.name}</div>
                <div className="expense-note">{item.category} • Due on {item.due_day}{getDaySuffix(item.due_day)}</div>
              </div>
              <div className="expense-amount" style={{ opacity: item.active ? 1 : 0.4 }}>{formatCurrency(item.amount)}</div>
              <div className="expense-actions">
                <button className="expense-action-btn" onClick={() => handleToggleActive(item)}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: item.active ? 'var(--success)' : 'var(--text-tertiary)' }}>{item.active ? 'ON' : 'OFF'}</span>
                </button>
                <button className="expense-action-btn" onClick={() => handleEdit(item)}>
                  <Pencil color="var(--text-tertiary)" size={16} strokeWidth={2} />
                </button>
                <button className="expense-action-btn" onClick={() => handleDelete(item.id)}>
                  <Trash2 color="var(--error)" size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
