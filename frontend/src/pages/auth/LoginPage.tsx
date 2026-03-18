import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/error';
import { isOnSubdomain } from '@/lib/subdomain';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginWithFacebook, isAuthenticated } = useAuth();

  const from = (location.state as { from?: string })?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // Navigate only after auth state has been committed to context
  useEffect(() => {
    if (redirectTo && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, redirectTo, navigate]);

  const getRedirect = (role: string, mustChangePassword?: boolean) => {
    if (mustChangePassword) return '/auth/force-change-password';
    if (from) return from;
    // On subdomain, always redirect to salon homepage
    if (isOnSubdomain()) return '/';
    return role === 'Client' ? '/' : '/admin';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      setRedirectTo(getRedirect(user.role, user.mustChangePassword));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const onSubdomain = isOnSubdomain();

  const handleGoogleRedirect = () => {
    const returnTo = encodeURIComponent(window.location.origin + (from || '/'));
    window.location.href = `/api/auth/google/start?returnTo=${returnTo}`;
  };

  const isHttps = window.location.protocol === 'https:';

  const handleFacebook = () => {
    window.FB?.login(
      res => {
        if (!res.authResponse?.accessToken) return;
        const token = res.authResponse.accessToken;
        setLoading(true);
        loginWithFacebook(token)
          .then(user => setRedirectTo(getRedirect(user.role, user.mustChangePassword)))
          .catch((err: unknown) => {
            toast.error(getErrorMessage(err, 'Facebook sign-in failed'));
          })
          .finally(() => setLoading(false));
      },
      { scope: 'email,public_profile' }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">Welcome back to BookVisit</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Link to="/auth/forgot-password" className="text-xs text-purple-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400">or continue with</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-center">
            {onSubdomain ? (
              <button
                type="button"
                onClick={handleGoogleRedirect}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            ) : (
              <GoogleLogin
                onSuccess={async credentialResponse => {
                  if (!credentialResponse.credential) return;
                  setLoading(true);
                  try {
                    const user = await loginWithGoogle(credentialResponse.credential);
                    setRedirectTo(getRedirect(user.role, user.mustChangePassword));
                  } catch (err: unknown) {
                    toast.error(getErrorMessage(err, 'Google sign-in failed'));
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => toast.error('Google sign-in failed')}
                width="368"
                text="signin_with"
                shape="rectangular"
              />
            )}
          </div>

          {isHttps ? (
            <button
              onClick={handleFacebook}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
          ) : null}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-purple-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          Are you a master/specialist?{' '}
          <Link to="/register/master" className="text-purple-600 font-medium hover:underline">
            Join as a Master
          </Link>
        </p>
      </div>
    </div>
  );
}
