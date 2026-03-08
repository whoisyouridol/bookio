import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md bg-[var(--color-surface)] rounded-t-3xl sm:rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: 'var(--font-family)' }}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>}
          <button onClick={onClose} className="ml-auto p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
