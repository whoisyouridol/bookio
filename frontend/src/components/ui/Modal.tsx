import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-md bg-[var(--color-surface)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] shadow-xl p-6 max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_var(--ease-out)]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="text-lg font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto p-1.5 hover:bg-[var(--color-hover)] rounded-full transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
