import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/error';
import { isOnSubdomain, getMainDomainUrl } from '@/lib/subdomain';
import { GlobalToolbar } from '@/components/GlobalToolbar';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogleAccessToken, loginWithFacebook, isAuthenticated } = useAuth();

  const from = (location.state as { from?: string })?.from;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (redirectTo && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, redirectTo, navigate]);

  const getRedirect = (role: string, mustChangePassword?: boolean) => {
    if (mustChangePassword) return '/auth/force-change-password';
    if (from) return from;
    if (isOnSubdomain()) return '/';
    return role === 'Client' ? '/' : '/admin';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(identifier, password);
      setRedirectTo(getRedirect(user.role, user.mustChangePassword));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('auth.invalidCredentials')));
    } finally {
      setLoading(false);
    }
  };

  const onSubdomain = isOnSubdomain();

  const handleGoogleRedirect = () => {
    const returnTo = encodeURIComponent(window.location.origin + (from || '/'));
    window.location.href = `/api/auth/google/start?returnTo=${returnTo}`;
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const user = await loginWithGoogleAccessToken(tokenResponse.access_token);
        setRedirectTo(getRedirect(user.role, user.mustChangePassword));
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, t('auth.googleSignInFailed')));
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error(t('auth.googleSignInFailed')),
  });

  const isHttps = window.location.protocol === 'https:';

  const handleFacebookRedirect = () => {
    const returnTo = encodeURIComponent(window.location.origin + (from || '/'));
    window.location.href = `/api/auth/facebook/start?returnTo=${returnTo}`;
  };

  const handleFacebook = () => {
    if (onSubdomain) {
      handleFacebookRedirect();
      return;
    }
    window.FB?.login(
      res => {
        if (!res.authResponse?.accessToken) return;
        const token = res.authResponse.accessToken;
        setLoading(true);
        loginWithFacebook(token)
          .then(user => setRedirectTo(getRedirect(user.role, user.mustChangePassword)))
          .catch((err: unknown) => {
            toast.error(getErrorMessage(err, t('auth.googleSignInFailed')));
          })
          .finally(() => setLoading(false));
      },
      { scope: 'email,public_profile' }
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 transition-colors relative" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="absolute top-4 right-4">
        <GlobalToolbar />
      </div>
      <div className="w-full max-w-sm bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] border border-[var(--color-border)] p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{t('auth.signIn')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">{t('auth.welcomeBack')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('auth.emailOrPhone')}</label>
            <input
              data-testid="login-identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20/20 transition-colors"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[var(--color-text)]">{t('auth.password')}</label>
              <Link to="/auth/forgot-password" className="text-xs text-[var(--color-primary)] hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <input
              data-testid="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20/20 transition-colors"
            />
          </div>

          <button
            data-testid="login-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2.5 rounded-[var(--radius-md)] text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-divider)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--color-surface)] px-3 text-[var(--color-text-tertiary)]">{t('auth.orContinueWith')}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onSubdomain ? handleGoogleRedirect() : googleLogin()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 border border-[var(--color-border)] rounded-[var(--radius-md)] py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-hover)] disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('auth.continueWithGoogle')}
          </button>

          {(isHttps || onSubdomain) && (
            <button
              onClick={handleFacebook}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-[var(--color-border)] rounded-[var(--radius-md)] py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-hover)] disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {t('auth.continueWithFacebook')}
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/register" className="text-[var(--color-primary)] font-medium hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
          {t('auth.ownASalon')}{' '}
          {isOnSubdomain() ? (
            <a href={`${getMainDomainUrl()}/register/professional`} className="text-[var(--color-primary)] font-medium hover:underline">
              {t('auth.joinAsAProfessional')}
            </a>
          ) : (
            <Link to="/register/professional" className="text-[var(--color-primary)] font-medium hover:underline">
              {t('auth.joinAsAProfessional')}
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
