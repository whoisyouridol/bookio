import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 mb-2">{t('errors.notFound.code')}</p>
        <h1 className="text-xl font-semibold text-[var(--color-text)] mb-2">{t('errors.notFound.title')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">{t('errors.notFound.description')}</p>
        <Link to="/">
          <Button size="lg">{t('common.backToHome')}</Button>
        </Link>
      </div>
    </div>
  );
}
