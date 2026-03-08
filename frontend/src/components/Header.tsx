import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function Header({ title, showBack = false, right }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 bg-[var(--color-surface)] border-b border-[var(--color-border)]" style={{ fontFamily: 'var(--font-family)' }}>
      <div className="flex items-center h-14 px-4 max-w-md mx-auto">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </button>
        )}
        <h1 className="flex-1 text-lg font-semibold text-[var(--color-text)]">{title}</h1>
        {right && <div>{right}</div>}
      </div>
    </header>
  );
}
