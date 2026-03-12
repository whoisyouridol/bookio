interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  /** 'admin' uses gray/purple styling, 'client' uses CSS variable theming */
  variant?: 'admin' | 'client';
}

export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  variant = 'admin',
}: FormFieldProps) {
  const isClient = variant === 'client';

  return (
    <div>
      <label
        className={`block text-sm font-medium mb-1.5 ${
          isClient ? 'text-[var(--color-text)]' : 'text-gray-700'
        }`}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className={
          isClient
            ? 'w-full p-3 border border-[var(--color-border)] text-[var(--color-text)] placeholder-gray-400 focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-surface)]'
            : 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-purple-500'
        }
        style={isClient ? { borderRadius: 'var(--border-radius)' } : undefined}
      />
    </div>
  );
}
