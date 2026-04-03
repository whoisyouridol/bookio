interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  error,
  disabled = false,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-[var(--color-text)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2.5 text-sm rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] transition-colors focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-[var(--color-error)]'
            : 'border-[var(--color-border)]'
        }`}
      />
      {error && (
        <p className="mt-1 text-xs text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}
