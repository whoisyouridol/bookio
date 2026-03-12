import type { ReactNode } from 'react';

interface InfoRowProps {
  icon: ReactNode;
  value: string;
  /** Optional label shown above the value (used in detail views) */
  label?: string;
}

export function InfoRow({ icon, value, label }: InfoRowProps) {
  if (label) {
    return (
      <div className="flex items-start gap-3">
        <div className="text-[var(--color-text-secondary)] mt-0.5">{icon}</div>
        <div>
          <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
          <p className="font-medium text-sm text-[var(--color-text)]">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-[var(--color-text)]">
      <span className="text-[var(--color-text-secondary)]">{icon}</span>
      {value}
    </div>
  );
}
