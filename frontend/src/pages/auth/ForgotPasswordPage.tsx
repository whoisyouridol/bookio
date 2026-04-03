import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '@/api/auth';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(identifier);
      setSent(true);
    } catch {
      toast.error(t('auth.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-8">
        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-[var(--color-success-subtle)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">{t('auth.checkYourEmail')}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6"
              dangerouslySetInnerHTML={{ __html: t('auth.ifAccountExists', { email: identifier }) }}
            />
            <Link to="/login" className="text-sm text-[var(--color-primary)] font-medium hover:underline">
              {t('auth.backToSignIn')}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{t('auth.resetPassword')}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              {t('auth.enterEmailResetLink')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.emailOrPhone')}</label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-[var(--color-text-secondary)]">
              <Link to="/login" className="text-[var(--color-primary)] font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
