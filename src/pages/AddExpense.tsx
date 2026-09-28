import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Check, Calendar, StickyNote, Plus } from 'lucide-react';
import { BUILT_IN_CATEGORIES, CUSTOM_COLORS, type CategoryDef } from '../constants/categories';
import { supabase } from '../lib/supabase';
import { todayDateStr, formatDisplayDate } from '../lib/date';
import type { CustomCategory } from '../types/expense';

export default function AddExpense() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get('editId');
  const isEditing = !!editId;

  const [amount, setAmount] = useState(isEditing ? searchParams.get('editAmount') ?? '' : '');
  const [selectedCategory, setSelectedCategory] = useState<CategoryDef>(
    BUILT_IN_CATEGORIES.find((c) => c.value === searchParams.get('editCategory')) ?? BUILT_IN_CATEGORIES[0]
  );
  const [note, setNote] = useState(isEditing ? searchParams.get('editNote') ?? '' : '');
  const [expenseDate, setExpenseDate] = useState(isEditing ? searchParams.get('editDate') ?? todayDateStr() : todayDateStr());
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CUSTOM_COLORS[0]);

  useEffect(() => {
    supabase.from('custom_categories').select('*').then(({ data, error }) => {
      if (!error && data) setCustomCats(data as CustomCategory[]);
    });
  }, []);

  const allCategories: CategoryDef[] = [
    ...BUILT_IN_CATEGORIES,
    ...customCats.map((c) => ({
      label: c.name,
      value: c.name,
      icon: BUILT_IN_CATEGORIES[BUILT_IN_CATEGORIES.length - 1].icon,
      color: c.color,
      isCustom: true,
    })),
  ];

  const handleSaveCustomCat = async () => {
    if (!newCatName.trim()) { alert('Please enter a category name.'); return; }
    try {
      const { data, error } = await supabase
        .from('custom_categories')
        .insert({ name: newCatName.trim(), color: newCatColor })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const newCat = data as CustomCategory;
        setCustomCats((prev) => [...prev, newCat]);
        setSelectedCategory({
          label: newCat.name,
          value: newCat.name,
          icon: BUILT_IN_CATEGORIES[BUILT_IN_CATEGORIES.length - 1].icon,
          color: newCat.color,
          isCustom: true,
        });
      }
      setNewCatName('');
      setNewCatColor(CUSTOM_COLORS[0]);
      setShowCustomCat(false);
    } catch (err) {
      alert('Failed to create custom category.');
      console.error(err);
    }
  };

  const handleSave = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) { alert('Please enter a valid amount.'); return; }

    setSaving(true);
    try {
      if (isEditing && editId) {
        const { error } = await supabase
          .from('expenses')
          .update({ amount: numAmount, category: selectedCategory.value, note: note.trim() || null, expense_date: expenseDate })
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('expenses').insert({
          amount: numAmount, category: selectedCategory.value, note: note.trim() || null, expense_date: expenseDate,
        });
        if (error) throw error;
      }
      window.dispatchEvent(new Event('expense-changed'));
      navigate(-1);
    } catch (err) {
      alert('Failed to save expense. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [amount, selectedCategory, note, expenseDate, isEditing, editId, navigate]);

  return (
    <div className="modal-overlay" onClick={() => navigate(-1)}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close-btn" onClick={() => navigate(-1)}>
            <X color="var(--text-primary)" size={24} strokeWidth={2} />
          </button>
          <div className="modal-title">{isEditing ? 'Edit Expense' : 'Add Expense'}</div>
          <button className="modal-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <Check color="var(--primary)" size={24} strokeWidth={2.5} />}
          </button>
        </div>

        <div className="modal-scroll">
          <div className="amount-section">
            <div className="form-label">Amount</div>
            <div className="amount-input-container">
              <span className="currency-symbol">₹</span>
              <input
                className="amount-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                type="text"
                inputMode="decimal"
                autoFocus={!isEditing}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-label">Category</div>
            <div className="category-grid">
              {allCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory.value === cat.value;
                return (
                  <button
                    key={cat.value}
                    className={`category-chip ${isSelected ? 'category-chip-selected' : ''}`}
                    style={{ ['--cat-color' as string]: cat.color }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <div className="category-chip-icon" style={{ backgroundColor: isSelected ? cat.color : cat.color + '20' }}>
                      <Icon color={isSelected ? 'var(--text-inverse)' : cat.color} size={18} strokeWidth={2} />
                    </div>
                    <span className={`category-chip-label ${isSelected ? 'category-chip-label-selected' : ''}`}>{cat.label}</span>
                  </button>
                );
              })}
              <button
                className="category-chip category-chip-add"
                onClick={() => setShowCustomCat(!showCustomCat)}
              >
                <div className="category-chip-icon" style={{ backgroundColor: 'var(--surface-alt)' }}>
                  <Plus color="var(--text-secondary)" size={18} strokeWidth={2} />
                </div>
                <span className="category-chip-label">New Category</span>
              </button>
            </div>

            {showCustomCat && (
              <div className="custom-cat-form">
                <input
                  className="custom-cat-input"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category name (e.g. Pet, Groceries)"
                  autoFocus
                />
                <div className="custom-cat-colors">
                  {CUSTOM_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`custom-cat-color-swatch ${newCatColor === color ? 'custom-cat-color-selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCatColor(color)}
                    />
                  ))}
                </div>
                <button className="custom-cat-save-btn" onClick={handleSaveCustomCat}>
                  <Check size={16} strokeWidth={2.5} /> Add Category
                </button>
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="form-label">Date</div>
            <button className="date-button" onClick={() => setShowDatePicker(true)}>
              <Calendar color="var(--text-secondary)" size={20} strokeWidth={2} />
              <span className="date-button-text">{formatDisplayDate(expenseDate)}</span>
            </button>
          </div>

          <div className="form-section">
            <div className="form-label">Note (Optional)</div>
            <div className="note-input-container">
              <StickyNote color="var(--text-tertiary)" size={18} strokeWidth={2} style={{ marginTop: 2, marginRight: 8, flexShrink: 0 }} />
              <textarea
                className="note-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                maxLength={200}
              />
            </div>
          </div>
        </div>
      </div>

      {showDatePicker && (
        <DatePickerModal
          initialDate={expenseDate}
          onSelect={(date) => { setExpenseDate(date); setShowDatePicker(false); }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}

function DatePickerModal({ initialDate, onSelect, onClose }: { initialDate: string; onSelect: (date: string) => void; onClose: () => void }) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const initialD = new Date(initialDate + 'T00:00:00');
  const [viewYear, setViewYear] = useState(initialD.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialD.getMonth());

  const today = new Date();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long' });

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); };
  const selD = new Date(selectedDate + 'T00:00:00');

  return (
    <div className="date-picker-overlay" onClick={onClose}>
      <div className="date-picker-container" onClick={(e) => e.stopPropagation()}>
        <div className="date-picker-header">
          <div className="date-picker-title">Select Date</div>
          <button onClick={onClose}><X color="var(--text-secondary)" size={22} strokeWidth={2} /></button>
        </div>
        <div className="date-picker-nav">
          <button className="date-picker-nav-btn" onClick={prevMonth}>‹</button>
          <span className="date-picker-month-label">{monthName} {viewYear}</span>
          <button className="date-picker-nav-btn" onClick={nextMonth}>›</button>
        </div>
        <div className="date-picker-week-header">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="date-picker-week-day">{d}</div>)}
        </div>
        <div className="date-picker-days">
          {days.map((day, idx) => {
            if (!day) return <div key={idx} className="date-picker-empty-day" />;
            const isSelected = day === selD.getDate() && viewMonth === selD.getMonth() && viewYear === selD.getFullYear();
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return (
              <button
                key={idx}
                className={`date-picker-day ${isSelected ? 'date-picker-day-selected' : ''} ${isToday && !isSelected ? 'date-picker-day-today' : ''}`}
                onClick={() => setSelectedDate(dateStr)}
              >
                {day}
              </button>
            );
          })}
        </div>
        <button className="date-picker-confirm-btn" onClick={() => onSelect(selectedDate)}>Confirm</button>
      </div>
    </div>
  );
}
