import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthNavigatorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  formatLabel?: (month: number, year: number) => string;
}

export default function MonthNavigator({ month, year, onChange, formatLabel }: MonthNavigatorProps) {
  const prev = () => {
    if (month === 0) onChange(11, year - 1);
    else onChange(month - 1, year);
  };

  const next = () => {
    if (month === 11) onChange(0, year + 1);
    else onChange(month + 1, year);
  };

  const label = formatLabel
    ? formatLabel(month, year)
    : new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="month-nav">
      <button className="month-nav-btn" onClick={prev}>
        <ChevronLeft color="var(--text-secondary)" size={24} strokeWidth={2} />
      </button>
      <span className="month-nav-label">{label}</span>
      <button className="month-nav-btn" onClick={next}>
        <ChevronRight color="var(--text-secondary)" size={24} strokeWidth={2} />
      </button>
    </div>
  );
}
