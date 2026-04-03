import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { GlobalToolbar } from '@/components/GlobalToolbar';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function Header({ title, showBack = false, right }: HeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-10 bg-[var(--color-surface)] border-b border-[var(--color-border)] transition-colors"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="flex items-center h-14 px-4 max-w-md mx-auto">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-1 -ml-1 hover:bg-[var(--color-hover)] rounded-full transition-colors"
            aria-label={t('components.header.goBack')}
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </button>
        )}
        <h1 className="flex-1 text-lg font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </h1>
        <div className="flex items-center gap-1">
          {right && <div>{right}</div>}
          <GlobalToolbar />
        </div>
      </div>
    </header>
  );
}
