import type { LucideIcon } from 'lucide-react';

export function EmptyState({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon: LucideIcon }) {
  return (
    <div className="state-container">
      <div className="state-icon-wrap">
        <Icon color="var(--text-tertiary)" size={32} strokeWidth={1.5} />
      </div>
      <div className="state-title">{title}</div>
      {subtitle && <div className="state-subtitle">{subtitle}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-container">
      <div className="state-title">{message}</div>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="state-container">
      <div className="spinner" />
    </div>
  );
}
