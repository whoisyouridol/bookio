import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/error';
import { isOnSubdomain } from '@/lib/subdomain';
import { GlobalToolbar } from '@/components/GlobalToolbar';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (redirectTo && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, redirectTo, navigate]);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email && !form.phone) {
      toast.error(t('auth.emailOrPhoneRequired'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        phone: form.phone || undefined,
        role: 'Client',
      });
      toast.success(t('auth.accountCreated'));
      setRedirectTo(isOnSubdomain() ? '/' : '/');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('auth.registrationFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-8 relative">
      <div className="absolute top-4 right-4">
        <GlobalToolbar />
      </div>
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{t('auth.createAccount')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">{t('auth.joinBookVisit')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.firstName')}</label>
              <input
                data-testid="register-first-name"
                type="text"
                value={form.firstName}
                onChange={set('firstName')}
                autoComplete="given-name"
                className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.lastName')}</label>
              <input
                data-testid="register-last-name"
                type="text"
                value={form.lastName}
                onChange={set('lastName')}
                autoComplete="family-name"
                className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.email')}</label>
            <input
              data-testid="register-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.phone')}</label>
            <input
              data-testid="register-phone"
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {t('auth.atLeastOneContactRequired')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.password')}</label>
            <input
              data-testid="register-password"
              type="password"
              required
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.confirmPassword')}</label>
            <input
              data-testid="register-confirm-password"
              type="password"
              required
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              autoComplete="new-password"
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <button
            data-testid="register-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
          >
            {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
