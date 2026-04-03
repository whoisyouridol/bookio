import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { changePassword } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/error';

export default function ForceChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success(t('auth.passwordChanged'));
      const dest = user?.role === 'Client' ? '/' : '/admin';
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('auth.failedToChangePassword')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{t('auth.setPassword')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          {t('auth.temporaryPasswordDescription')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              {t('auth.temporaryPassword')}
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.newPassword')}</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
              {t('auth.confirmNewPassword')}
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
          >
            {loading ? t('auth.saving') : t('auth.setPasswordAndContinue')}
          </button>
        </form>
      </div>
    </div>
  );
}
