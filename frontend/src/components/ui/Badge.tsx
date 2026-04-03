import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const variants = {
  default: 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]',
  success: 'bg-[var(--color-success-subtle)] text-[var(--color-success-text)]',
  warning: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning-text)]',
  error: 'bg-[var(--color-error-subtle)] text-[var(--color-error-text)]',
  info: 'bg-[var(--color-info-subtle)] text-[var(--color-info-text)]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

export function bookingStatusBadge(status: string) {
  const map: Record<string, BadgeProps['variant']> = {
    Pending: 'warning',
    Confirmed: 'success',
    Completed: 'info',
    CancelledByClient: 'error',
    CancelledByMaster: 'error',
  };
  return map[status] ?? 'default';
}
